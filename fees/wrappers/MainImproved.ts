import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type MainImprovedConfig = {
    addr: Address
};

export function mainImprovedConfigToCell(config: MainImprovedConfig): Cell {
    return beginCell()
        .storeAddress(config.addr)
    .endCell();
}

export class MainImproved implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MainImproved(address);
    }

    static createFromConfig(config: MainImprovedConfig, code: Cell, workchain = 0) {
        const data = mainImprovedConfigToCell(config);
        const init = { code, data };
        return new MainImproved(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMessage(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
            .endCell(),
        });
    }
}
