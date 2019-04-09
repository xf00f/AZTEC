
const BN = require('bn.js');
const web3Utils = require('web3-utils');
const crypto = require('crypto');

const bn128 = require('../bn128');
const secp256k1 = require('../secp256k1');
const setup = require('../setup');
const utils = require('./utils');
const { noteCoder } = require('../abiEncoder');

const { getSharedSecret, getNoteHash } = utils;
const { padLeft } = web3Utils;

/**
 * Create a Diffie-Hellman shared secret for a given public key
 *
 * @method createSharedSecret
 * @private
 * @memberof module:noteUtils
 * @param {Object} pubicKeyHex elliptic.js hex-formatted public key
 * @return {{type: string, name: ephemeralKey}} elliptic.js hex-formatted ephemeral key
 * @return {{type: string, name: encoded}} hex-string formatted shared secret
 */
function createSharedSecret(publicKeyHex) {
    const publicKey = secp256k1.ec.keyFromPublic(publicKeyHex.slice(2), 'hex');

    const ephemeralKey = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
    const sharedSecret = publicKey.getPublic().mul(ephemeralKey.priv);
    const sharedSecretHex = `0x${sharedSecret.encode(false).toString('hex')}`;
    const encoded = web3Utils.sha3(sharedSecretHex, 'hex');
    return {
        ephemeralKey: `0x${ephemeralKey.getPublic(true, 'hex')}`,
        encoded,
    };
}

/**
 * Initializes a new instance of Note from either a public key or a viewing key.
 * @class
 * @param {string} publicKey hex-formatted public key
 * @param {string} viewingKey hex-formatted viewing key
 * @param {string} owner Ethereum address of note owner
 * @classdesc A class for AZTEC zero-knowledge notes.
 *   Notes have public keys and viewing keys.  
 *   The viewing key is required to use note in an AZTEC zero-knowledge proof
 */
function Note(publicKey, viewingKey, owner = '0x') {
    if (publicKey && viewingKey) {
        throw new Error('expected one of publicKey or viewingKey, not both');
    }
    /**
     * Ethereum address of note's owner
     * @member {string}
     */
    this.owner = owner;
    if (publicKey) {
        if (typeof (publicKey) !== 'string') {
            throw new Error(`expected key type ${typeof (publicKey)} to be of type string`);
        }
        if (publicKey.length !== 200) {
            throw new Error(`invalid public key length, expected 200, got ${publicKey.length}`);
        }
        /**
         * Viewing key of note. BN instance in bn128 group's reduction context
         * @member {BN}
         */
        this.a = null;
        /**
         * Value of note. BN instance in bn128 group's reduction context
         * @member {BN}
         */
        this.k = null;
        /**
         * AZTEC commitment point \gamma, a bn128 group element
         * @member {Point}
         */
        this.gamma = bn128.curve.decodePoint(publicKey.slice(2, 68), 'hex');
        /**
         * AZTEC commitment point \sigma, a bn128 group element
         * @member {Point}
         */
        this.sigma = bn128.curve.decodePoint(publicKey.slice(68, 134), 'hex');
        /**
         * Note's ephemeral key, a secp256k1 group element. A note owner can use this point
         * to compute the note's viewing key.
         * @member {Point}
         */
        this.ephemeral = secp256k1.ec.keyFromPublic(publicKey.slice(134, 200), 'hex');
    }
    if (viewingKey) {
        if (typeof (viewingKey) !== 'string') {
            throw new Error(`expected key type ${typeof (viewingKey)} to be of type string`);
        }
        if (viewingKey.length !== 140) {
            throw new Error(`invalid viewing key length, expected 140, got ${viewingKey.length}`);
        }
        this.a = new BN(viewingKey.slice(2, 66), 16).toRed(bn128.groupReduction);
        this.k = new BN(viewingKey.slice(66, 74), 16).toRed(bn128.groupReduction);
        const { x, y } = setup.readSignatureSync(this.k.toNumber());
        const mu = bn128.curve.point(x, y);
        this.gamma = (mu.mul(this.a));
        this.sigma = this.gamma.mul(this.k).add(bn128.h.mul(this.a));
        this.ephemeral = secp256k1.ec.keyFromPublic(viewingKey.slice(74, 140), 'hex');
    }
    /**
     * keccak256 hash of note coordinates, aligned in 32-byte chunks.  
     *  Alignment is [gamma.x, gamma.y, sigma.x, sigma.y]
     * @member {string}
     */
    this.noteHash = getNoteHash(this.gamma, this.sigma);
}

/**
 * Get the public key representation of a note
 *
 * @name Note#getPublic
 * @function
 * @returns {string} hex-string concatenation of the note coordinates and the ephemeral key (compressed)
 */
Note.prototype.getPublic = function getPublic() {
    const ephemeral = this.ephemeral.getPublic();
    return noteCoder.encodeNotePublicKey({ gamma: this.gamma, sigma: this.sigma, ephemeral });
};

/**
 * Get the viewing key of a note
 *
 * @name Note#getView
 * @function
 * @returns {string} hex-string concatenation of the note value and AZTEC viewing key
 */
Note.prototype.getView = function getView() {
    if (!BN.isBN(this.k) || !BN.isBN(this.a)) {
        return '0x';
    }
    const a = padLeft(this.a.fromRed().toString(16), 64);
    const k = padLeft(this.k.fromRed().toString(16), 8);
    const ephemeral = padLeft(this.ephemeral.getPublic(true, 'hex'), 66);
    return `0x${a}${k}${ephemeral}`;
};

/**
 * Compute value of a note, from the public key and the spending key
 *
 * @name Note#derive
 * @function
 * @returns {string} hex-string concatenation of the note coordinates and the ephemeral key (compressed)
 */
Note.prototype.derive = async function derive(spendingKey) {
    const sharedSecret = getSharedSecret(this.ephemeral.getPublic(), spendingKey);
    this.a = new BN(sharedSecret.slice(2), 16).toRed(bn128.groupReduction);
    const gammaK = this.sigma.add(bn128.h.mul(this.a).neg());
    this.k = new BN(await bn128.recoverMessage(this.gamma, gammaK)).toRed(bn128.groupReduction);
};

/**
 * Export note coordinates in a form that can be used by proof.js
 *
 * @name Note#exportNote
 * @function
 * @returns {{ publicKey:string, viewingKey: string, k: string, a: string, noteHash: string }}
 */
Note.prototype.exportNote = function exportNote() {
    const publicKey = this.getPublic();
    const viewingKey = this.getView();
    let k = '0x';
    let a = '0x';
    if (BN.isBN(this.k)) {
        k = padLeft(this.k.fromRed().toString(16), 64);
    }
    if (BN.isBN(this.a)) {
        a = padLeft(this.a.fromRed().toString(16), 64);
    }
    return {
        publicKey,
        viewingKey,
        k,
        a,
        noteHash: this.noteHash,
    };
};

/**
 * Export note's ephemeral key in compressed string form
 *
 * @name Note#exportMetadata
 * @function
 * @returns {string} hex-string compressed ephemeral key
 */
Note.prototype.exportMetadata = function exportMetadata() {
    const res = this.ephemeral.getPublic(true, 'hex');
    return `0x${res}`;
};

/**
 * Helper module to create Notes from public keys and view keys
 *
 * @module note
 */
const note = {};
note.utils = utils;

/**
 * Create Note instance from an event log and a spending key
 *
 * @method fromEventLog
 * @param {string} logNoteData the note data returned from an event log
 * @returns {Note} created note instance
 */
note.fromEventLog = async (logNoteData, spendingKey = null) => {
    const publicKey = noteCoder.decodeNoteFromEventLog(logNoteData);
    const newNote = new Note(publicKey, null);
    if (spendingKey) {
        await newNote.derive(spendingKey);
    }
    return newNote;
};

/**
 * Create Note instance from a Note public key
 *
 * @method fromPublicKey
 * @param {string} publicKey the public key for the note
 * @returns {Note} created note instance
 */
note.fromPublicKey = (publicKey) => {
    return new Note(publicKey, null);
};

/**
 * Create Note instance from a viewing key
 *
 * @method fromViewKey
 * @param {string} viewingKey the viewing key for the note
 * @returns {Note} created note instance
 */
note.fromViewKey = (viewingKey) => {
    const newNote = new Note(null, viewingKey);
    return newNote;
};

/**
 * Create Note instance from a public key and a spending key
 *
 * @method derive
 * @param {string} publicKey hex-string formatted note public key
 * @param {string} spendingKey hex-string formatted spending key (can also be an Ethereum private key)
 * @returns {Note} created note instance
 */
note.derive = async (publicKey, spendingKey) => {
    const newNote = new Note(publicKey);
    await newNote.derive(spendingKey);
    return newNote;
};

/**
 * Create a Note instance from a recipient public key and a desired value
 *
 * @method fromValue
 * @param {string} publicKey hex-string formatted recipient public key
 * @param {number} value value of the note
 * @returns {Note} created note instance
 */
note.create = (spendingPublicKey, value) => {
    const sharedSecret = createSharedSecret(spendingPublicKey);
    const a = padLeft(new BN(sharedSecret.encoded.slice(2), 16).umod(bn128.curve.n).toString(16), 64);
    const k = padLeft(web3Utils.toHex(value).slice(2), 8);
    const ephemeral = padLeft(sharedSecret.ephemeralKey.slice(2), 66);
    const viewingKey = `0x${a}${k}${ephemeral}`;
    const owner = secp256k1.ecdsa.accountFromPublicKey(spendingPublicKey);
    return new Note(null, viewingKey, owner);
};

/**
 * Encode compressed metadata of an array of notes as a hex-string, with each entry occupying 33 bytes
 *
 * @method fromValue
 * @param {string} publicKey hex-string formatted recipient public key
 * @param {number} value value of the note
 * @returns {Note} created note instance
 */
note.encodeMetadata = (noteArray) => {
    return noteArray.reduce((acc, aztecNote) => {
        const ephemeral = aztecNote.exportMetadata();
        return `${acc}${padLeft(ephemeral.slice(2), 66)}`; // remove elliptic.js encoding byte, broadcast metadata is always compressed
    }, '0x');
};

/**
 * Create a zero value note with from a constant a to make the hash of the initial totalMinted note in
 * mintable assets a constant
 *
 * @method createZeroValueNote
 * @returns {Note} created note instance
 */
note.createZeroValueNote = () => note.fromViewKey(utils.constants.ZERO_VALUE_NOTE_VIEWING_KEY);

/**
 * Export the Note class as part of the note module. We shouldn't really use this directly, but useful for testing purposes
 *
 * @memberof module:note
 */
note.Note = Note;

module.exports = note;
