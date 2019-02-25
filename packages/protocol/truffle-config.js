require('dotenv').config();
const { CoverageSubprovider } = require('@0x/sol-coverage');
const { ProfilerSubprovider } = require('@0x/sol-profiler');
const { RevertTraceSubprovider, TruffleArtifactAdapter } = require('@0x/sol-trace');
const { constants: { DEVNET_SEALER } } = require('@aztec/dev-utils');
const ProviderEngine = require('web3-provider-engine');
const RpcProvider = require('web3-provider-engine/subproviders/rpc.js');
const { toWei, toHex } = require('web3-utils');
const HDWalletProvider = require('truffle-hdwallet-provider');

const web3 = require('./web3Provider');

// Checking that the docker is running by filtering the devnet's default params. Note 
// that it is possible, although unlikely, that the network id is 50 and the sealer 
// account has a non-zero balance even when running ganache.
async function checkCoverageNetwork() {
    const networkId = await web3.eth.net.getId();
    const balance = web3.utils.fromWei(await web3.eth.getBalance(DEVNET_SEALER));
    if (networkId !== 50 || balance === '0') {
        console.log('Coverage only works with the 0xorg/devnet docker image and NOT with other ethereum nodes like ganache');
        process.exit(1);
    }
}

// You must specify PRIVATE_KEY and INFURA_API_KEY in your .env file
// Feel free to replace PRIVATE_KEY with a MNEMONIC to use an hd wallet
function createProvider(network) {
    if (!process.env.PRIVATE_KEY && !process.env.MNEMONIC) {
        console.log('Please set either your PRIVATE_KEY or MNEMONIC in a .env file');
        process.exit(1);
    }
    if (!process.env.INFURA_API_KEY) {
        console.log('Please set your INFURA_API_KEY');
        process.exit(1);
    }
    return () => {
        return new HDWalletProvider(
            process.env.PRIVATE_KEY || process.env.MNEMONIC,
            `https://${network}.infura.io/v3/` + process.env.INFURA_API_KEY
        );
    };
}

let kovanProvider = {};
let rinkebyProvider = {};
let mainnetProvider = {};
let ropstenProvider = {};

const projectRoot = '';
const solcVersion = '0.5.4';
const defaultFromAddress = DEVNET_SEALER;
const isVerbose = true;
const artifactAdapter = new TruffleArtifactAdapter(projectRoot, solcVersion);
const provider = new ProviderEngine();

switch (process.env.MODE) {
    case 'profile':
        global.profilerSubprovider = new ProfilerSubprovider(
            artifactAdapter,
            defaultFromAddress,
            isVerbose
        );
        global.profilerSubprovider.stop();
        provider.addProvider(global.profilerSubprovider);
        break;
    case 'coverage':
        checkCoverageNetwork();
        global.coverageSubprovider = new CoverageSubprovider(
            artifactAdapter,
            defaultFromAddress,
            isVerbose
        );
        provider.addProvider(global.coverageSubprovider);
        break;
    case 'trace':
        provider.addProvider(new RevertTraceSubprovider(
            artifactAdapter,
            defaultFromAddress,
            isVerbose
        ));
        break;
    default:
        kovanProvider = createProvider('kovan');
        rinkebyProvider = createProvider('rinkeby');
        mainnetProvider = createProvider('mainnet');
        ropstenProvider = createProvider('ropsten');
        break;
}

provider.addProvider(new RpcProvider({ rpcUrl: 'http://localhost:8545' }));
provider.start((err) => {
    if (err !== undefined) {
        console.log(err);
        process.exit(1);
    }
});

/**
 * HACK: Truffle providers should have `send` function, while `ProviderEngine` creates providers with `sendAsync`,
 * but it can be easily fixed by assigning `sendAsync` to `send`.
 */
provider.send = provider.sendAsync.bind(provider);

module.exports = {
    compilers: {
        solc: {
            version: '0.5.4',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
            },
        },
    },
    mocha: {
        enableTimeouts: false,
        reporter: 'spec',
    },
    networks: {
        development: {
            provider,
            gas: 4700000,
            gasPrice: toHex(toWei('1', 'gwei')),
            network_id: '*', // eslint-disable-line camelcase
            port: 8545,
        },
        kovan: {
            provider: kovanProvider,
            gas: 6000000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '42',
        },
        mainnet: {
            provider: mainnetProvider,
            gas: 6000000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '1',
        },
        rinkeby: {
            provider: rinkebyProvider,
            gas: 4700000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '4',
        },
        ropsten: {
            provider: ropstenProvider,
            gas: 4700000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '3',
        },
    },
};
