/**
 * Exposes an interface to create AZTEC notes and construct AZTEC zero-knowledge proofs
 *
 * @module notesController
 */

import { Address } from 'web3x/address';
import { WalletsController } from '../wallets';
import { Note, NoteDao, NoteStatus } from './note-dao';

const aztec = require('aztec.js');

interface AztecNote {
  publicKey: string;
  viewingKey: string;
  k: string;
  a: string;
  noteHash: string;
}

export interface Proof {
  proofData: string[][];
  m: number;
  challenge: string;
  inputSignatures: string[][];
  outputOwners: Address[];
  metadata: string;
  noteHashes: string[];
}

export class NoteController {
  constructor(private noteDao: NoteDao, private wallets: WalletsController) {}

  public get(noteHash) {
    const rawNote = this.noteDao.get(noteHash);

    if (!rawNote) {
      throw new Error(`could not find note at ${noteHash}`);
    }

    return {
      note: aztec.note.fromViewKey(rawNote.viewingKey),
      ...rawNote,
    };
  }

  public createNote(owner: Address, value: number) {
    const wallet = this.wallets.get(owner);
    const note = aztec.note.create(wallet.publicKey, value);
    const exported: Note = {
      ...(note.exportNote() as AztecNote),
      owner: owner.toString(),
      status: 'OFF_CHAIN',
    };
    this.noteDao.create(exported);
    return note;
  }

  public setNoteStatus(noteHash: string, status: NoteStatus) {
    const note = this.noteDao.get(noteHash)!;
    return this.noteDao.update(noteHash, {
      ...note,
      status,
    });
  }

  public encodeMetadata(noteArray) {
    return aztec.note.encodeMetadata(noteArray);
  }

  public createConfidentialTransfer(
    inputNoteOwners: { privateKey: string }[],
    inputNoteHashes: string[],
    outputNoteData: [Address, number][],
    v: number,
    senderAddress: Address,
    joinSplitAddress: Address
  ) {
    const inputNotes = inputNoteHashes.map(noteHash => this.get(noteHash));
    const outputNotes = outputNoteData.map(([owner, value]) => this.createNote(owner, value));
    const encoded = aztec.proof.joinSplit.encodeJoinSplitTransaction({
      inputNotes,
      outputNotes,
      senderAddress: senderAddress.toString(),
      inputNoteOwners,
      publicOwner: senderAddress.toString(),
      kPublic: v,
      validatorAddress: joinSplitAddress.toString(),
    });

    return encoded;
  }
}
