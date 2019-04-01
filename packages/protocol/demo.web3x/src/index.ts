import { abiEncoder } from 'aztec.js';
import levelup from 'levelup';
import memdown from 'memdown';
import { Address } from 'web3x/address';
import { Eth } from 'web3x/eth';
import { EvmProvider } from 'web3x/evm/provider';
import { EthereumProvider, WebsocketProvider } from 'web3x/providers';
import { Wallet } from 'web3x/wallet';
import { ZkAsset, ZkAssetTransactionReceipt } from './contracts/ZkAsset';
import { Db, MemoryDb } from './db';
import { deployContracts, SCALING_FACTOR } from './deploy';
import { NoteController, Proof } from './notes';
import { NoteDao } from './notes/note-dao';
import { TransactionsController } from './transactions';
import { TransactionsDao } from './transactions/transactions-dao';
import { WalletsController } from './wallets';
import { WalletsDao } from './wallets/wallets-dao';

async function demoTransactions(provider: EthereumProvider, wallet: Wallet) {
  const eth = new Eth(provider);
  const accounts = wallet.currentAddresses();
  const chainId = await eth.getId();

  console.log(`Running on chainId: ${chainId}`);

  const db = new MemoryDb();
  const walletsController = new WalletsController(new WalletsDao(db.walletsDatabase), eth);
  const noteController = new NoteController(new NoteDao(db.database), walletsController);
  const transactionsController = new TransactionsController(new TransactionsDao(db.database), noteController, eth);

  await walletsController.initFromWallet(wallet);

  eth.defaultFromAddress = accounts[0];

  const { erc20, ace, joinSplit, zkErc20 } = await deployContracts(eth, chainId);

  console.log('Minting 100 tokens...');
  await erc20.methods
    .mint(accounts[0], SCALING_FACTOR.muln(100))
    .send()
    .getReceipt();
  console.log('Minted.');

  console.log(`Approving aztec to spend 100 tokens owned by ${accounts[0]}`);
  await erc20.methods
    .approve(ace.address!, SCALING_FACTOR.muln(100))
    .send()
    .getReceipt();

  const receipts: ZkAssetTransactionReceipt[] = [];
  // const proofs: string[] = [];

  console.log('Issuing first join-split transaction...');
  const { proofData, expectedOutput } = noteController.createConfidentialTransfer(
    [],
    [[accounts[0], 22], [accounts[0], 20], [accounts[1], 22], [accounts[2], 36]],
    -100,
    accounts[0],
    joinSplit.address!
  );

  const proofOutput = abiEncoder.outputCoder.getProofOutput(expectedOutput, 0);
  const proofHash = abiEncoder.outputCoder.hashProofOutput(proofOutput);
  await ace.methods
    .publicApprove(zkErc20.address!, proofHash, 100)
    .send()
    .getReceipt();

  receipts[0] = await confidentialTransfer(accounts[0], zkErc20, proofData, transactionsController);
  console.log('First join-split transaction mined, issuing second join-split transaction...');

  /*
  proofs[1] = noteController.createConfidentialTransfer(
    chainId,
    [proofs[0].noteHashes[0], proofs[0].noteHashes[2]],
    [[accounts[0], 30], [accounts[2], 14]],
    0,
    accounts[0],
    aztec.address!
  );

  receipts[1] = await confidentialTransfer(accounts[0], aztec, proofs[1], transactionsController);
  console.log('Second join-split transaction mined, issuing third join-split transaction...');

  proofs[2] = noteController.createConfidentialTransfer(
    chainId,
    [proofs[0].noteHashes[1], proofs[0].noteHashes[3]],
    [[accounts[0], 25], [accounts[2], 25]],
    6,
    accounts[1],
    aztec.address!
  );

  receipts[2] = await confidentialTransfer(accounts[1], aztec, proofs[2], transactionsController);
  console.log('Third join-split transaction mined.');
  */
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
  // const provider = new WebsocketProvider('ws://localhost:8545');
  const wallet = Wallet.fromMnemonic('alarm disagree index ridge tone outdoor betray pole forum source okay joy', 3);
  await provider.loadWallet(wallet);
  try {
    await demoTransactions(provider, wallet);
  } finally {
    // provider.disconnect();
  }
}

main().catch(console.error);
