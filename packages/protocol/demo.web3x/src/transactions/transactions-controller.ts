import { Eth } from 'web3x/eth';
import { TransactionReceipt } from 'web3x/formatters';
import { leftPad, sha3 } from 'web3x/utils';
import { ZkAssetTransactionReceipt } from '../contracts/ZkAsset';
import { NoteController, Proof } from '../notes';
import { TransactionsDao, TxType } from './transactions-dao';

/**
 * Exposes an interface to create, read and update Ethereum transactions.
 *
 * @module transactionsController
 */
export class TransactionsController {
  constructor(private dao: TransactionsDao, private noteController: NoteController, private eth: Eth) {}

  /**
   * Create a new transaction entry. Does not broadcast transaction to network
   * (see: {@link module:deployer~methodWrapper})).
   * @method newTransaction
   * @param {module:config.TX_TYPES} transactionType the type enum of the transaction
   * @param {string} transactionHash the Ethereum transaction hash
   */
  public newTransaction(type: TxType, transactionHash: string) {
    return this.dao.create({
      status: 'SENT',
      type,
      transactionHash,
    });
  }

  /**
   * Set a transaction's status to mined {@link module:config.TX_TYPES} and attach transation receipt data
   * @method updateMinedTransaction
   * @param {string} transactionHash the Ethereum transaction hash
   * @param {Object} transactionReceipt the transaction receipt object
   * @param {Object} [transactionData] the input transaction data object
   */
  public updateMinedTransaction(
    transactionHash: string,
    transactionReceipt: TransactionReceipt,
    transactionData: any = {}
  ) {
    return this.dao.update(transactionHash, {
      status: 'MINED',
      transactionReceipt,
      transactionData,
    });
  }

  /**
   * Get a transaction by its transaction hash
   * @method get
   * @param {string} transactionHash the Ethereum transaction hash
   * @returns {Object} the transaction object
   */
  public get(transactionHash: string) {
    return this.dao.get(transactionHash);
  }

  /**
   * Get a transaction's transaction receipt object and update transaction's database entry
   * @method getTransactionReceipt
   * @param {string} transactionHash the Ethereum transaction hash
   * @returns {Object} the transaction receipt object
   */
  public async getTransactionReceipt(transactionHash: string) {
    const transaction = this.get(transactionHash);
    if (!transaction) {
      throw new Error(`could not find transaction ${transactionHash}`);
    }
    const transactionReceipt = await this.eth.getTransactionReceipt(transactionHash);
    if (!transactionReceipt) {
      throw new Error('Could not get receipt.');
    }
    this.updateMinedTransaction(transactionHash, transactionReceipt);
    return transactionReceipt;
  }

  public async updateConfidentialTransferTransaction(
    transactionReceipt: ZkAssetTransactionReceipt,
    { proofData: notes, m }: Proof
  ) {
    const transactionData = await this.eth.getTransaction(transactionReceipt.transactionHash);

    const inputNoteHashes = notes.slice(0, m).map(note => {
      const noteString = note.slice(2).reduce((acc, s) => `${acc}${leftPad(s.slice(2), 64)}`, '0x');
      return sha3(noteString);
    });
    const outputNoteHashes = notes.slice(m, notes.length).map(note => {
      const noteString = note.slice(2).reduce((acc, s) => `${acc}${leftPad(s.slice(2), 64)}`, '0x');
      return sha3(noteString);
    });

    inputNoteHashes.forEach(noteHash => {
      this.noteController.setNoteStatus(noteHash, 'SPENT');
    });
    outputNoteHashes.forEach(noteHash => {
      this.noteController.setNoteStatus(noteHash, 'UNSPENT');
    });

    this.updateMinedTransaction(
      transactionReceipt.transactionHash,
      transactionReceipt as TransactionReceipt,
      transactionData
    );
  }
}
