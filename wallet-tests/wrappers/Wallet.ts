import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, internal, MessageRelaxed, Sender, SendMode, storeMessageRelaxed } from 'ton-core';

export type WalletConfig = {
    publicKey: Buffer;
};

export function walletConfigToCell(config: WalletConfig): Cell {
    return beginCell()
        .storeUint(0, 32)
        .storeBuffer(config.publicKey)
    .endCell();
}

export class Wallet implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Wallet(address);
    }

    static createFromConfig(config: WalletConfig, code: Cell, workchain = 0) {
        const data = walletConfigToCell(config);
        const init = { code, data };
        return new Wallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMsg(
        provider: ContractProvider,
        opts: {
            msgToSend: MessageRelaxed;
            validUntil: bigint
            signFunc: (buf: Buffer) => Buffer;
            seqno: number;
            mode: SendMode;
        }
    ) {
        
        const cellToSign = beginCell()
            .storeUint(opts.seqno, 32)
            .storeUint(opts.validUntil, 32)
            .storeUint(opts.mode, 8)
            .storeRef(beginCell().store(storeMessageRelaxed(opts.msgToSend)))
        .endCell();

        const sig = opts.signFunc(cellToSign.hash());

        await provider.external(
            beginCell().storeBuffer(sig).storeSlice(cellToSign.asSlice()).endCell()
        );
    }
}
