import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { MainImproved } from '../wrappers/MainImproved';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

describe('Main', () => {
    let code: Cell;
    let sender: SandboxContract<TreasuryContract>;
    let addr: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        code = await compile('MainImproved');
    });

    let blockchain: Blockchain;
    let main: SandboxContract<MainImproved>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        sender = await blockchain.treasury('sender');
        addr = await blockchain.treasury('addr');

        main = blockchain.openContract(MainImproved.createFromConfig({
            addr: addr.address
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and main are ready to use
    });

    it('should send message', async () => {
        const res = await main.sendMessage(addr.getSender(), toNano('0.05'));

        expect(res.transactions).toHaveTransaction({
            from: addr.address,
            to: main.address,
            success: true, 
            outMessagesCount: 1
        });

        printTransactionFees(res.transactions);

        console.log(res.transactions[1].totalFees.coins);
        
    });

    it('should throw exception in case of bad sender', async () => {
        const res = await main.sendMessage(sender.getSender(), toNano('0.05'));

        expect(res.transactions).toHaveTransaction({
            from: sender.address,
            to: main.address,
            success: false, 
            exitCode: 500
        });

        printTransactionFees(res.transactions);

      //  console.log(res.transactions[1].totalFees.coins);
        
    });
});
