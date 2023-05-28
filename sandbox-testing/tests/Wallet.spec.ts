import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Wallet } from '../wrappers/Wallet';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Wallet', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Wallet');
    });

    let blockchain: Blockchain;
    let wallet: SandboxContract<Wallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        wallet = blockchain.openContract(Wallet.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await wallet.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: wallet.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and wallet are ready to use
    });
});
