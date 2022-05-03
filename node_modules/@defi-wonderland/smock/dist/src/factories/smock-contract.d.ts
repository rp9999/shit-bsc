import { FactoryOptions } from '@nomiclabs/hardhat-ethers/types';
import { BaseContract, ContractFactory, ethers } from 'ethers';
import { ObservableVM } from '../observable-vm';
import { FakeContract, MockContractFactory } from '../types';
export declare function createFakeContract<Contract extends BaseContract>(vm: ObservableVM, address: string, contractInterface: ethers.utils.Interface, provider: ethers.providers.Provider): Promise<FakeContract<Contract>>;
export declare function createMockContractFactory<T extends ContractFactory>(vm: ObservableVM, contractName: string, signerOrOptions?: ethers.Signer | FactoryOptions): Promise<MockContractFactory<T>>;
