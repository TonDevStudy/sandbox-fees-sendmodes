import { Blockchain, SandboxContract, printTransactionFees } from '@ton-community/sandbox';
import { Cell, SendMode, beginCell, internal, toNano } from 'ton-core';
import { Wallet } from '../wrappers/Wallet';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { KeyPair, mnemonicNew, mnemonicToPrivateKey, sign } from 'ton-crypto';
import { randomAddress } from '@ton-community/test-utils';

async function randomKp(): Promise<KeyPair> {
    let mnemonics = await mnemonicNew();
    return mnemonicToPrivateKey(mnemonics);
}

describe('Wallet', () => {
    let code: Cell;
    let kp: KeyPair;

    beforeAll(async () => {
        code = await compile('Wallet');
    });

    let blockchain: Blockchain;
    let wallet: SandboxContract<Wallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        kp = await randomKp();

        wallet = blockchain.openContract(Wallet.createFromConfig({
            publicKey: kp.publicKey
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await wallet.sendDeploy(deployer.getSender(), toNano('2'));

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
        console.log((await blockchain.getContract(wallet.address)).accountState?.type)
    });

    it('should accept external messages', async () => {

        const msg = internal({
            to: randomAddress(),
            value: toNano('1'),
            body: 'optional text here'
        });

        const res = await wallet.sendMsg(
            {
                msgToSend: msg,
                seqno: 0,
                signFunc: (buf) => sign(buf, kp.secretKey),
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, // 1 + 2 mode
                validUntil: BigInt(Math.floor(Date.now() / 1000) + 60)
            }
        );

        expect(res.transactions).toHaveTransaction({
            to: wallet.address,
            success: true,
            outMessagesCount: 1
        });

       // printTransactionFees(res.transactions);

       console.log(res.transactions[0].vmLogs);
    });

    
    it('should throw exception in case of a wrong signature', async () => {
        const badKeypair = await randomKp();

        expect.assertions(2);

        const msg = internal({
            to: randomAddress(),
            value: toNano('1'),
            body: 'optional text here'
        });

        const res = wallet.sendMsg(
            {
                msgToSend: msg,
                seqno: 0,
                signFunc: (buf) => sign(buf, badKeypair.secretKey),
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, // 1 + 2 mode
                validUntil: BigInt(Math.floor(Date.now() / 1000) + 60)
            }
        );

        await expect(res).rejects.toThrow();

    });

    it('should be protected against replay attacks', async () => {

        let signature: Buffer;

        expect.assertions(2);

        const msg = internal({
            to: randomAddress(),
            value: toNano('1'),
            body: 'optional text here'
        });

        await wallet.sendMsg(
            {
                msgToSend: msg,
                seqno: 0,
                signFunc: (buf) => { signature = sign(buf, kp.secretKey); return signature },
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, // 1 + 2 mode
                validUntil: BigInt(Math.floor(Date.now() / 1000) + 60)
            }
        );

        await expect(wallet.sendMsg(
            {
                msgToSend: msg,
                seqno: 0,
                signFunc: (buf) => { return signature },
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, // 1 + 2 mode
                validUntil: BigInt(Math.floor(Date.now() / 1000) + 60)
            }
        )).rejects.toThrow();

    });
});
