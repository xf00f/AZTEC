import { ContractAbi} from 'web3x/contract';
export default new ContractAbi([
  {
    "constant": true,
    "inputs": [],
    "name": "JOIN_SPLIT_PROOF",
    "outputs": [
      {
        "name": "",
        "type": "uint24"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "ZERO_VALUE_NOTE_HASH",
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
    "constant": false,
    "inputs": [
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "supplementTokens",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "disabledValidators",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "validators",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "MINT_PROOF",
    "outputs": [
      {
        "name": "",
        "type": "uint24"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "isOwner",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      },
      {
        "name": "_proofOutput",
        "type": "bytes"
      },
      {
        "name": "_proofSender",
        "type": "address"
      }
    ],
    "name": "updateNoteRegistry",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "latestEpoch",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_linkedTokenAddress",
        "type": "address"
      },
      {
        "name": "_scalingFactor",
        "type": "uint256"
      },
      {
        "name": "_canAdjustSupply",
        "type": "bool"
      },
      {
        "name": "_canConvert",
        "type": "bool"
      }
    ],
    "name": "createNoteRegistry",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "validatedProofs",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "BURN_PROOF",
    "outputs": [
      {
        "name": "",
        "type": "uint24"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_registryOwner",
        "type": "address"
      },
      {
        "name": "_proofHash",
        "type": "bytes32"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "publicApprove",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "getRegistry",
    "outputs": [
      {
        "name": "linkedToken",
        "type": "address"
      },
      {
        "name": "scalingFactor",
        "type": "uint256"
      },
      {
        "name": "totalSupply",
        "type": "uint256"
      },
      {
        "name": "confidentialTotalMinted",
        "type": "bytes32"
      },
      {
        "name": "confidentialTotalBurned",
        "type": "bytes32"
      },
      {
        "name": "canConvert",
        "type": "bool"
      },
      {
        "name": "canAdjustSupply",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_registryOwner",
        "type": "address"
      },
      {
        "name": "_noteHash",
        "type": "bytes32"
      }
    ],
    "name": "getNote",
    "outputs": [
      {
        "name": "status",
        "type": "uint8"
      },
      {
        "name": "createdOn",
        "type": "uint40"
      },
      {
        "name": "destroyedOn",
        "type": "uint40"
      },
      {
        "name": "noteOwner",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "_commonReferenceString",
        "type": "bytes32[6]"
      }
    ],
    "name": "SetCommonReferenceString",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "epoch",
        "type": "uint8"
      },
      {
        "indexed": true,
        "name": "category",
        "type": "uint8"
      },
      {
        "indexed": true,
        "name": "id",
        "type": "uint8"
      },
      {
        "indexed": false,
        "name": "validatorAddress",
        "type": "address"
      }
    ],
    "name": "SetProof",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "newLatestEpoch",
        "type": "uint8"
      }
    ],
    "name": "IncrementLatestEpoch",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      },
      {
        "name": "_proofData",
        "type": "bytes"
      },
      {
        "name": "_proofSender",
        "type": "address"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "name": "",
        "type": "bytes"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      },
      {
        "name": "_proofData",
        "type": "bytes"
      },
      {
        "name": "_proofSender",
        "type": "address"
      }
    ],
    "name": "burn",
    "outputs": [
      {
        "name": "",
        "type": "bytes"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      },
      {
        "name": "_sender",
        "type": "address"
      },
      {
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "validateProof",
    "outputs": [
      {
        "name": "",
        "type": "bytes"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      },
      {
        "name": "_proofHashes",
        "type": "bytes32[]"
      }
    ],
    "name": "clearProofByHashes",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_commonReferenceString",
        "type": "bytes32[6]"
      }
    ],
    "name": "setCommonReferenceString",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      }
    ],
    "name": "invalidateProof",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      },
      {
        "name": "_proofHash",
        "type": "bytes32"
      },
      {
        "name": "_sender",
        "type": "address"
      }
    ],
    "name": "validateProofByHash",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      },
      {
        "name": "_validatorAddress",
        "type": "address"
      }
    ],
    "name": "setProof",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "incrementLatestEpoch",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getCommonReferenceString",
    "outputs": [
      {
        "name": "",
        "type": "bytes32[6]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_proof",
        "type": "uint24"
      }
    ],
    "name": "getValidatorAddress",
    "outputs": [
      {
        "name": "validatorAddress",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
]);