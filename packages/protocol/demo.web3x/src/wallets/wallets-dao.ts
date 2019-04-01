import { LowdbSync } from 'lowdb';
import { Address } from 'web3x/address';

interface DbSchema {
  wallets: Wallet[];
}

export interface Wallet {
  address?: string;
  publicKey: string;
  privateKey: string;
  name: string;
  nonce: number;
}

export class WalletsDao {
  private static initialState: Wallet = {
    publicKey: '',
    privateKey: '',
    name: '',
    nonce: 0,
  };

  constructor(private db: LowdbSync<DbSchema>) {}

  public create(data: Wallet) {
    const wallet = this.db
      .get('wallets')
      .find({ name: data.name })
      .value();

    if (wallet) {
      throw new Error('wallet already exists');
    }

    this.db
      .get('wallets')
      .push({ ...WalletsDao.initialState, ...data })
      .write();

    return this.db
      .get('wallets')
      .find({ name: data.name })
      .value();
  }

  public update(address: Address, data: Wallet) {
    return this.db
      .get('wallets')
      .find({ address: address.toString() })
      .assign(data)
      .write();
  }

  public get(address: Address) {
    return this.db
      .get('wallets')
      .find({ address: address.toString() })
      .value();
  }
}
