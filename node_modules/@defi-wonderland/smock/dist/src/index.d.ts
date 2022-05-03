/// <reference types="chai" />
import { FactoryOptions } from '@nomiclabs/hardhat-ethers/types';
import { BaseContract, ContractFactory, ethers } from 'ethers';
import './chai-plugin/types';
import { FakeContract, FakeContractOptions, FakeContractSpec, MockContractFactory } from './types';
declare function fake<T extends BaseContract>(spec: FakeContractSpec, opts?: FakeContractOptions): Promise<FakeContract<T>>;
declare function mock<T extends ContractFactory>(contractName: string, signerOrOptions?: ethers.Signer | FactoryOptions): Promise<MockContractFactory<T>>;
export * from './types';
export declare const smock: {
    fake: typeof fake;
    mock: typeof mock;
    matchers: Chai.ChaiPlugin;
};
