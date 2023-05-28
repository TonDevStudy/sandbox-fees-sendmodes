import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import { TupleItemSlice } from 'ton-core/dist/tuple/tuple';

export type MinterConfig = {
    adminAddress: Address;
    jettonWalletCode: Cell;
};

export function minterConfigToCell(config: MinterConfig): Cell {
    return beginCell()
        .storeCoins(0)
        .storeAddress(config.adminAddress)
        .storeUint(0, 2)
        .storeRef(config.jettonWalletCode)
    .endCell();
}

export class Minter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Minter(address);
    }

    static createFromConfig(config: MinterConfig, code: Cell, workchain = 0) {
        const data = minterConfigToCell(config);
        const init = { code, data };
        return new Minter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMint(provider: ContractProvider, via: Sender, 
        opts: {
            toAddress: Address;
            jettonAmount: bigint;
            amount: bigint;
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(21, 32)
                .storeUint(0, 64)
                .storeAddress(opts.toAddress)
                .storeCoins(opts.amount)
                .storeRef(
                    beginCell()
                        .storeUint(0x178d4519, 32)
                        .storeUint(0, 64)
                        .storeCoins(opts.jettonAmount)
                        .storeAddress(this.address)
                        .storeAddress(this.address)
                        .storeCoins(0)
                        .storeUint(0, 1)
                    .endCell()
                )
            .endCell(),
        });
    }

    async sendCallTo(provider: ContractProvider, via: Sender,
        opts: {
            toAddress: Address;
            amount: bigint;
            masterMsg: Cell;
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(6, 32)
                .storeUint(0, 64)
                .storeAddress(opts.toAddress)
                .storeCoins(opts.amount)
                .storeRef(opts.masterMsg)
            .endCell(),
        });
    }

    async sendUpgradeMinter(provider: ContractProvider, via: Sender,
        opts: {
            newData: Cell;
            newCode: Cell;
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(5, 32)
                .storeUint(0, 64)
                .storeRef(opts.newData)
                .storeRef(opts.newCode)
            .endCell(),
        });
    }

    async getWalletAddress(provider: ContractProvider, address: Address): Promise<Address> {
        const result = await provider.get('get_wallet_address', [
            {
                type: 'slice',
                cell: beginCell().storeAddress(address).endCell()
            } as TupleItemSlice
        ]);

        return result.stack.readAddress();
    }

    async getTotalSupply(provider: ContractProvider): Promise<bigint> {
        const result = await provider.get('get_jetton_data', []);
        return result.stack.readBigNumber();
    }

    async getAdminAddress(provider: ContractProvider): Promise<Address> {
        const result = (await provider.get('get_jetton_data', [])).stack;
        result.skip(2);
        return result.readAddress();
    }

    async getContent(provider: ContractProvider): Promise<Cell> {
        const result = (await provider.get('get_jetton_data', [])).stack;
        result.skip(3);
        return result.readCell();
    }

    async getWalletCode(provider: ContractProvider): Promise<Cell> {
        const result = (await provider.get('get_jetton_data', [])).stack;
        result.skip(4);
        return result.readCell();
    }
}
