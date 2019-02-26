require('dotenv').config();
const { CoverageSubprovider } = require('@0x/sol-coverage');
const { RevertTraceSubprovider, TruffleArtifactAdapter } = require('@0x/sol-trace');
const { GanacheSubprovider } = require('@0x/subproviders');
const HDWalletProvider = require('truffle-hdwallet-provider');
const ProviderEngine = require('web3-provider-engine');
const { toWei, toHex } = require('web3-utils');

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
const defaultFromAddress = '0x98c0047400dA37d278E76e78c6F60A7882Ae064d';
const isVerbose = true;
const artifactAdapter = new TruffleArtifactAdapter(projectRoot, solcVersion);
const provider = new ProviderEngine();

switch (process.env.MODE) {
    case 'coverage':
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

let ganacheSubprovider = {};
ganacheSubprovider = new GanacheSubprovider();
provider.addProvider(ganacheSubprovider);

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
