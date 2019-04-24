import { abiEncoder } from 'aztec.js';
import levelup from 'levelup';
import memdown from 'memdown';
import { Address } from 'web3x/address';
import { Eth } from 'web3x/eth';
import { EvmProvider } from 'web3x/evm/provider';
import { EthereumProvider, WebsocketProvider } from 'web3x/providers';
import { bufferToHex } from 'web3x/utils';
import { Wallet } from 'web3x/wallet';
import { ZkAsset, ZkAssetTransactionReceipt } from './contracts/ZkAsset';
import { Db, MemoryDb } from './db';
import { deployContracts, SCALING_FACTOR } from './deploy';
import { NoteController } from './notes';
import { NoteDao } from './notes/note-dao';
import { TransactionsController } from './transactions';
import { TransactionsDao } from './transactions/transactions-dao';
import { WalletsController } from './wallets';
import { WalletsDao } from './wallets/wallets-dao';

const { note, proof } = require('aztec.js');

async function demoTransactions(provider: EthereumProvider, wallet: Wallet) {
  const eth = new Eth(provider);
  const addresses = wallet.currentAddresses();
  const accounts = addresses.map(a => {
    const acc = wallet.get(a)!;
    return {
      address: acc.address.toString(),
      publicKey: bufferToHex(acc.publicKey),
      privateKey: bufferToHex(acc.privateKey),
    };
  });
  const chainId = await eth.getId();

  console.log(`Running on chainId: ${chainId}`);

  const db = new MemoryDb();
  const walletsController = new WalletsController(new WalletsDao(db.walletsDatabase), eth);
  const noteController = new NoteController(new NoteDao(db.database), walletsController);
  const transactionsController = new TransactionsController(new TransactionsDao(db.database), noteController, eth);

  await walletsController.initFromWallet(wallet);

  console.log(`Default address: ${addresses[0]}`);
  eth.defaultFromAddress = addresses[0];

  const { erc20, ace, joinSplit, zkErc20 } = await deployContracts(eth, chainId);

  console.log('Minting 100 tokens...');
  await erc20.methods
    .mint(addresses[0], SCALING_FACTOR.muln(100))
    .send()
    .getReceipt();
  console.log('Minted.');

  console.log(`Approving aztec to spend 100 tokens owned by ${addresses[0]}`);
  await erc20.methods
    .approve(ace.address!, SCALING_FACTOR.muln(100))
    .send()
    .getReceipt();

  const receipts: ZkAssetTransactionReceipt[] = [];
  // const proofs: string[] = [];

  const notes1 = [note.create(accounts[0].publicKey, 70), note.create(accounts[0].publicKey, 30)];
  const notes2 = [note.create(accounts[1].publicKey, 40), note.create(accounts[1].publicKey, 60)];

  {
    console.log('Issuing first join-split transaction...');
    const { proofData, expectedOutput } = proof.joinSplit.encodeJoinSplitTransaction({
      inputNotes: [],
      outputNotes: notes1,
      senderAddress: accounts[0].address,
      inputNoteOwners: [],
      publicOwner: accounts[0].address,
      kPublic: -100,
      validatorAddress: joinSplit.address!.toString(),
    });

    const depositProofOutput = abiEncoder.outputCoder.getProofOutput(expectedOutput, 0);
    const depositProofHash = abiEncoder.outputCoder.hashProofOutput(depositProofOutput);

    await ace.methods
      .publicApprove(zkErc20.address!, depositProofHash, 100)
      .send()
      .getReceipt();

    receipts[0] = await confidentialTransfer(addresses[0], zkErc20, proofData, transactionsController);
  }

  {
    console.log('First join-split transaction mined, issuing second join-split transaction...');
    const { proofData } = proof.joinSplit.encodeJoinSplitTransaction({
      inputNotes: notes1,
      outputNotes: notes2,
      senderAddress: accounts[0].address,
      inputNoteOwners: [accounts[0], accounts[0]],
      publicOwner: accounts[0].address,
      kPublic: 0,
      validatorAddress: joinSplit.address!.toString(),
    });

    receipts[1] = await confidentialTransfer(addresses[0], zkErc20, proofData, transactionsController);
  }

  console.log('Second join-split transaction mined, issuing third join-split transaction...');
  // console.log('Third join-split transaction mined.');
}

async function confidentialTransfer(
  from: Address,
  zkAsset: ZkAsset,
  proofData: string,
  transactionsController: TransactionsController
) {
  const sentTx = await zkAsset.methods.confidentialTransfer(proofData).send({ from });

  transactionsController.newTransaction('AZTEC_TOKEN_CONFIDENTIAL_TRANSFER', await sentTx.getTxHash());

  const receipt = await sentTx.getReceipt();

  // await transactionsController.updateConfidentialTransferTransaction(receipt, proof);

  return receipt;
}

async function main() {
  const provider = await EvmProvider.fromDb(levelup(memdown()));
  const wallet = Wallet.fromMnemonic('alarm disagree index ridge tone outdoor betray pole forum source okay joy', 3);
  await provider.loadWallet(wallet);
  await demoTransactions(provider, wallet);
}

async function mainG() {
  const provider = new WebsocketProvider('ws://localhost:8545');
  const wallet = Wallet.fromMnemonic('alarm disagree index ridge tone outdoor betray pole forum source okay joy', 3);
  try {
    await demoTransactions(provider, wallet);
  } finally {
    provider.disconnect();
  }
}

main().catch(console.error);
