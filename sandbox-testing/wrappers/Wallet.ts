import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type WalletConfig = {};

export function walletConfigToCell(config: WalletConfig): Cell {
    return beginCell().endCell();
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
}
