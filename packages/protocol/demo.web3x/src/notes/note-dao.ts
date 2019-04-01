import { LowdbSync } from 'lowdb';

interface DbSchema {
  notes: Note[];
}

export type NoteStatus = 'OFF_CHAIN' | 'UNSPENT' | 'SPENT';

export interface Note {
  publicKey: string;
  viewingKey: string;
  k: string;
  a: string;
  owner: string;
  noteHash: string;
  parentToken?: string;
  status: NoteStatus;
}

export class NoteDao {
  constructor(private db: LowdbSync<DbSchema>) {}

  private static initialState = {
    publicKey: '',
    viewingKey: '',
    k: '',
    a: '',
    owner: '',
    noteHash: '',
    parentToken: '',
    status: 'OFF_CHAIN',
  };

  public create(data: Note) {
    const note = this.db
      .get('notes')
      .find({ noteHash: data.noteHash })
      .value();

    if (note) {
      throw new Error(`note ${data.noteHash} already exists`);
    }

    this.db
      .get('notes')
      .push({ ...NoteDao.initialState, ...data })
      .write();

    return this.db
      .get('notes')
      .find({ noteHash: data.noteHash })
      .value();
  }

  public update(noteHash: string, data: Note) {
    return this.db
      .get('notes')
      .find({ noteHash })
      .assign(data)
      .write();
  }

  public get(noteHash: string) {
    return this.db
      .get('notes')
      .find({ noteHash })
      .value();
  }
}
