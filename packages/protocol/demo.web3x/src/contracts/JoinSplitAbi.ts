import { ContractAbi} from 'web3x/contract';
export default new ContractAbi([
  {
    "constant": true,
    "inputs": [],
    "name": "EIP712_DOMAIN_HASH",
    "outputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "fallback"
  }
]);