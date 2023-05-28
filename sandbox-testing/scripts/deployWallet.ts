import { toNano } from 'ton-core';
import { Wallet } from '../wrappers/Wallet';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const wallet = provider.open(Wallet.createFromConfig({}, await compile('Wallet')));

    await wallet.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(wallet.address);

    // run methods on `wallet`
}
