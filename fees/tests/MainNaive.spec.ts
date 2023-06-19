import { Blockchain, SandboxContract, TreasuryContract, printTransactionFees } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { MainNaive } from '../wrappers/MainNaive';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('MainNaive', () => {
    let code: Cell;
    let sender: SandboxContract<TreasuryContract>;
    let addr: SandboxContract<TreasuryContract>;
    
    beforeAll(async () => {
        code = await compile('MainNaive');
    });

    let blockchain: Blockchain;
    let mainNaive: SandboxContract<MainNaive>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        sender = await blockchain.treasury('sender');
        addr = await blockchain.treasury('addr');

        mainNaive = blockchain.openContract(MainNaive.createFromConfig({
            addr: addr.address
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await mainNaive.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mainNaive.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and mainNaive are ready to use
    });

    it('should send message', async () => {
        const res = await mainNaive.sendMessage(addr.getSender(), toNano('0.05'));

        expect(res.transactions).toHaveTransaction({
            from: addr.address,
            to: mainNaive.address,
            success: true, 
            outMessagesCount: 1
        });

        printTransactionFees(res.transactions);

        console.log(res.transactions[1].totalFees.coins);
        
    });

    it('should throw exception in case of bad sender', async () => {
        const res = await mainNaive.sendMessage(sender.getSender(), toNano('0.05'));

        expect(res.transactions).toHaveTransaction({
            from: sender.address,
            to: mainNaive.address,
            success: false, 
            exitCode: 500
        });

        printTransactionFees(res.transactions);

      //  console.log(res.transactions[1].totalFees.coins);
        
    });
});
