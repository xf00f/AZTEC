/* eslint-disable no-await-in-loop */
const { constants: { DEVNET_SEALER } } = require('@aztec/dev-utils');
const web3 = require('../web3Provider');

/** 
 * Using the 0xorg/devnet Docker image, so Truffle
 * accounts are not by default preloaded with Ether.
 * 
 * @url https://github.com/0xProject/0x-monorepo/tree/development/packages/devnet
 */
const main = async () => {
    if (process.env.MODE !== 'coverage') {
        return;
    }

    const accounts = await web3.eth.getAccounts();
    for (let i = 0; i < accounts.length; i += 1) {
        await web3.eth.sendTransaction({
            from: DEVNET_SEALER,
            to: accounts[i],
            value: '500000000000000000', // 0.5 ether
        });
    }
};

main();
