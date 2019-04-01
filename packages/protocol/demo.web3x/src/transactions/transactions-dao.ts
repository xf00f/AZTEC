import { LowdbSync } from 'lowdb';

interface DbSchema {
  transactions: Transaction[];
}

export type TxStatus = 'UNSIGNED' | 'SENT' | 'MINED';
export type TxType =
  | 'AZTEC_TOKEN_CONFIDENTIAL_TRANSFER'
  | 'AZTEC_JOIN_SPLIT'
  | 'DOORBELL_SET_BLOCK'
  | 'ERC20_APPROVE'
  | 'ERC20_MINT';

export interface Transaction {
  transactionHash?: string;
  transactionReceipt?: any;
  transactionData?: any;
  status: TxStatus;
  type?: TxType;
}

export class TransactionsDao {
  constructor(private db: LowdbSync<DbSchema>) {}

  public create(data: Transaction) {
    const transaction = this.db
      .get('transactions')
      .find({ transactionHash: data.transactionHash })
      .value();

    if (transaction) {
      throw new Error(`transaction ${data.transactionHash} already exists`);
    }

    this.db
      .get('transactions')
      .push(data)
      .write();

    return this.db
      .get('transactions')
      .find({ transactionHash: data.transactionHash })
      .value();
  }

  public update(transactionHash: string, data: Transaction) {
    return this.db
      .get('transactions')
      .find({ transactionHash })
      .assign(data)
      .write();
  }

  public get(transactionHash: string) {
    return this.db
      .get('transactions')
      .find({ transactionHash })
      .value();
  }
}
