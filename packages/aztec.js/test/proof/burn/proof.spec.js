const { constants: { K_MAX } } = require('@aztec/dev-utils');
const BN = require('bn.js');
const chai = require('chai');
const { randomHex } = require('web3-utils');

const bn128 = require('../../../src/bn128');
const secp256k1 = require('../../../src/secp256k1');
const notes = require('../../../src/note');
const proof = require('../../../src/proof/burn');
const proofUtils = require('../../../src/proof/proofUtils');

const { expect } = chai;

function validateGroupScalar(hex, canBeZero = false) {
    const scalar = new BN(hex.slice(2), 16);
    expect(scalar.lt(bn128.curve.n)).to.equal(true);
    if (!canBeZero) {
        expect(scalar.gt(new BN(0))).to.equal(true);
    }
}

function validateGroupElement(xHex, yHex) {
    const x = new BN(xHex.slice(2), 16);
    const y = new BN(yHex.slice(2), 16);
    expect(x.gt(new BN(0))).to.equal(true);
    expect(y.gt(new BN(0))).to.equal(true);
    expect(x.lt(bn128.curve.p)).to.equal(true);
    expect(y.lt(bn128.curve.p)).to.equal(true);
    const lhs = x.mul(x).mul(x).add(new BN(3));
    const rhs = y.mul(y);
    expect(lhs.umod(bn128.curve.p).eq(rhs.umod(bn128.curve.p))).that.equal(true);
}

describe('Burn proof construction tests', () => {
    it('proof.constructProof creates a proof with well-formed outputs', () => {
        const newTotalBurned = 50;
        const oldTotalBurned = 30;
        const burnOne = 10;
        const burnTwo = 10;

        const kIn = [newTotalBurned];
        const kOut = [oldTotalBurned, burnOne, burnTwo];
        const sender = randomHex(20);
        const testNotes = proofUtils.makeTestNotes(kIn, kOut);

        const { proofData, challenge } = proof.constructProof(testNotes, sender);
        const numNotes = 4;

        expect(proofData.length).to.equal(numNotes);
        expect(challenge.length).to.equal(66);
        validateGroupScalar(challenge);
        proofData.forEach((note, i) => {
            validateGroupScalar(note[0], i === (proofData.length - 1));
            validateGroupScalar(note[1]);
            validateGroupElement(note[2], note[3]);
            validateGroupElement(note[4], note[5]);
        });
    });

    it('proof.constructProof will throw if point not on curve', () => {
        const newTotalBurned = 50;
        const oldTotalBurned = 30;
        const burnOne = 10;
        const burnTwo = 10;

        const kIn = [newTotalBurned];
        const kOut = [oldTotalBurned, burnOne, burnTwo];
        const sender = randomHex(20);
        const testNotes = proofUtils.makeTestNotes(kIn, kOut);

        testNotes[0].gamma.x = new BN(bn128.curve.p.add(new BN(100))).toRed(bn128.curve.red);
        try {
            proof.constructProof(testNotes, sender);
        } catch (err) {
            expect(err.message).to.contain('NOT_ON_CURVE');
        }
    });

    it('proof.constructProof will throw if point at infinity', () => {
        const newTotalBurned = 50;
        const oldTotalBurned = 30;
        const burnOne = 10;
        const burnTwo = 10;

        const kIn = [newTotalBurned];
        const kOut = [oldTotalBurned, burnOne, burnTwo];
        const sender = randomHex(20);
        const testNotes = proofUtils.makeTestNotes(kIn, kOut);

        testNotes[0].gamma = testNotes[0].gamma.add(testNotes[0].gamma.neg());
        let message = '';
        try {
            proof.constructProof(testNotes, sender);
        } catch (err) {
            ({ message } = err);
        }
        expect(message).to.contain('POINT_AT_INFINITY');
    });

    it('proof.constructProof will throw if viewing key response is 0', () => {
        const newTotalBurned = 50;
        const oldTotalBurned = 30;
        const burnOne = 10;
        const burnTwo = 10;

        const kIn = [newTotalBurned];
        const kOut = [oldTotalBurned, burnOne, burnTwo];
        const sender = randomHex(20);
        const testNotes = proofUtils.makeTestNotes(kIn, kOut);

        testNotes[0].a = new BN(0).toRed(bn128.groupReduction);
        try {
            proof.constructProof(testNotes, sender);
        } catch (err) {
            expect(err.message).to.contain('VIEWING_KEY_MALFORMED');
        }
    });

    it('proof.constructProof will throw if value > K_MAX', () => {
        const newTotalBurned = 50;
        const oldTotalBurned = 30;
        const burnOne = 10;
        const burnTwo = 10;

        const kIn = [newTotalBurned];
        const kOut = [oldTotalBurned, burnOne, burnTwo];
        const sender = randomHex(20);
        const testNotes = proofUtils.makeTestNotes(kIn, kOut);

        testNotes[0].k = new BN(K_MAX + 1).toRed(bn128.groupReduction);
        try {
            proof.constructProof(testNotes, sender);
        } catch (err) {
            expect(err.message).to.contain('NOTE_VALUE_TOO_BIG');
        }
    });

    it('proof.constructProof will throw if n < 2', () => {
        const noteValue = 50;
        const testNote = notes.create(secp256k1.generateAccount().publicKey, noteValue);
        const sender = proofUtils.randomAddress();

        try {
            proof.constructProof(testNote, sender);
        } catch (err) {
            expect(err.message).to.equal('INCORRECT_NOTE_NUMBER');
        }
    });
});
