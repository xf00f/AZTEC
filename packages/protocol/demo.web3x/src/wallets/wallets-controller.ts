/**
 * Exposes an interface to create and interact with AZTEC wallets.
 * To keep the proof of concept simple this controller doesn't support stealth wallets yet.
 * Stay tuned for updates!
 *
 * @module walletController
 */

import { Address } from 'web3x/address';
import { Eth } from 'web3x/eth';
import { bufferToHex, sha3 } from 'web3x/utils';
import { Wallet } from 'web3x/wallet';
import { WalletsDao } from './wallets-dao';

const aztec = require('aztec.js');

export class WalletsController {
  constructor(private walletsDao: WalletsDao, private eth: Eth) {}

  /**
   * Create a wallet entry from an Ethereum public key. Can't be used to sign transactions
   * @method createFromPublicKey
   * @param {string} publicKey hex-string of uncompressed public key (64 bytes)
   * @param {string} name the name of this wallet
   */
  public createFromPublicKey(publicKey: string, name: string) {
    const publicHash = sha3(publicKey);
    const address = Address.toChecksumAddress(`0x${publicHash.slice(-40)}`);
    const wallet = {
      name,
      publicKey,
      privateKey: '',
      address,
      nonce: 0,
    };
    return this.walletsDao.create(wallet);
  }

  /**
   * Create a wallet entry from an Ethereum private key.
   * @method createFromPrivateKey
   * @param {string} publicKey hex-string formatted private key
   * @param {string} name the name of this wallet
   */
  public createFromPrivateKey(privateKey: string, name: string) {
    const { publicKey, address } = aztec.secp256k1.accountFromPrivateKey(privateKey);
    const wallet = {
      name,
      privateKey,
      publicKey,
      address,
      nonce: 0,
    };
    return this.walletsDao.create(wallet);
  }

  /**
   * Get a wallet entry by Ethereum address
   * @method createFromPrivateKey
   * @param {string} address hex-string formatted Ethereum address
   * @returns {Object} the wallet object
   */
  public get(address: Address) {
    const wallet = this.walletsDao.get(address);
    if (!wallet) {
      throw new Error(`could not find wallet at address ${address}`);
    }
    return wallet;
  }

  /**
   * Update a wallet with new data
   * @method update
   * @param {string} address hex-string formatted Ethereum address
   * @param {Object} data data to add/change in wallet
   * @returns {Object} the new wallet object
   */
  public update(address: Address, data) {
    const wallet = this.walletsDao.get(address);
    if (!wallet) {
      throw new Error(`could not find wallet at address ${address}`);
    }
    return this.walletsDao.update(address, {
      ...wallet,
      ...data,
    });
  }

  /**
   * Initialize a wallet. Will update the wallet's nonce with latest on-chain value.
   * If wallet address does not exist, will look in 'accounts.json' for a matching entry
   * @method init
   * @param {string} address hex-string formatted Ethereum address
   */
  public async init(address: Address, accounts: any) {
    const wallet = this.walletsDao.get(address);

    if (!wallet) {
      // wallet doesn't exist in db, check private key store
      let account: any = null;
      if (accounts) {
        account = accounts.keys.find(t => t.address === address);
      }
      if (!account) {
        throw new Error(`could not find account in db or keystore that corresponds to ${address}`);
      }
      this.createFromPrivateKey(account.private, address.toString());
    }

    const nonce = await this.eth.getTransactionCount(address);
    this.update(address, { nonce });
  }

  public async initFromWallet(wallet: Wallet) {
    for (const i of wallet.currentIndexes()) {
      const { address, privateKey } = wallet.get(i)!;

      if (this.walletsDao.get(address)) {
        const nonce = await this.eth.getTransactionCount(address);
        this.update(address, { nonce });
        continue;
      }

      this.createFromPrivateKey(bufferToHex(privateKey), address.toString());
    }
  }
}
