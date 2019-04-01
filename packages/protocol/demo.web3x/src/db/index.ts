import low, { LowdbSync } from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import Memory from 'lowdb/adapters/Memory';

export class Db {
  public database: LowdbSync<any>;
  public walletsDatabase: LowdbSync<any>;

  private static initialState = { transactions: [], notes: [] };
  private static walletsInitialState = { wallets: [] };

  constructor() {
    const adapter = new FileSync('db.json');
    this.database = low(adapter);

    const walletAdapter = new FileSync('wallets.json');
    this.walletsDatabase = low(walletAdapter);

    this.database.defaults(Db.initialState).write();
    this.walletsDatabase.defaults(Db.walletsInitialState).write();
  }

  public clear() {
    this.database.setState(Db.initialState);
    this.walletsDatabase.setState(Db.walletsInitialState);
  }
}

export class MemoryDb {
  public database: LowdbSync<any>;
  public walletsDatabase: LowdbSync<any>;

  private static initialState = { transactions: [], notes: [] };
  private static walletsInitialState = { wallets: [] };

  constructor() {
    const adapter = new Memory('db.json');
    this.database = low(adapter);

    const walletAdapter = new Memory('wallets.json');
    this.walletsDatabase = low(walletAdapter);

    this.database.defaults(MemoryDb.initialState).write();
    this.walletsDatabase.defaults(MemoryDb.walletsInitialState).write();
  }

  public clear() {
    this.database.setState(MemoryDb.initialState);
    this.walletsDatabase.setState(MemoryDb.walletsInitialState);
  }
}
