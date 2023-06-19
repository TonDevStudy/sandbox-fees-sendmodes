import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type MainNaiveConfig = {
    addr: Address;
};

export function mainNaiveConfigToCell(config: MainNaiveConfig): Cell {
    return beginCell()
        .storeAddress(config.addr)
    .endCell();
}

export class MainNaive implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MainNaive(address);
    }

    static createFromConfig(config: MainNaiveConfig, code: Cell, workchain = 0) {
        const data = mainNaiveConfigToCell(config);
        const init = { code, data };
        return new MainNaive(contractAddress(workchain, init), init);
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
