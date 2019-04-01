import { constants, proofs } from '@aztec/dev-utils';
import BN from 'bn.js';
import { Eth } from 'web3x/eth';
import { ACE } from './contracts/ACE';
import { ERC20Mintable } from './contracts/ERC20Mintable';
import { JoinSplit } from './contracts/JoinSplit';
import { ZkAsset } from './contracts/ZkAsset';

const { CRS } = constants;

export const SCALING_FACTOR = new BN('100000000000000000', 10);

export async function deployContracts(eth: Eth, chainId: number) {
  console.log('Deploying contracts...');

  console.log('ERC20');
  const erc20 = new ERC20Mintable(eth, undefined, { gas: 5000000 });
  await erc20
    .deploy()
    .send()
    .getReceipt();
  console.log(`Deployed at: ${erc20.address}`);

  console.log('ACE');
  const ace = new ACE(eth, undefined, { gas: 5000000 });
  await ace
    .deploy()
    .send()
    .getReceipt();
  console.log(`Deployed at: ${ace.address}`);
  await ace.methods
    .setCommonReferenceString(CRS)
    .send()
    .getReceipt();

  console.log('JoinSplit');
  const joinSplit = new JoinSplit(eth, undefined, { gas: 5000000 });
  await joinSplit
    .deploy()
    .send()
    .getReceipt();
  console.log(`Deployed at: ${joinSplit.address}`);

  await ace.methods
    .setProof(proofs.JOIN_SPLIT_PROOF, joinSplit.address!)
    .send()
    .getReceipt();

  console.log('ZKERC20');
  const zkErc20 = new ZkAsset(eth, undefined, { gas: 5000000 });
  await zkErc20
    .deploy(ace.address!, erc20.address!, SCALING_FACTOR, true, true)
    .send()
    .getReceipt();
  console.log(`Deployed at: ${zkErc20.address}`);

  return { erc20, ace, joinSplit, zkErc20 };
}
