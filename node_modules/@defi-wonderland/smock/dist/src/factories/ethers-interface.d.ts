import { ethers } from 'ethers';
import { FakeContractSpec } from '../types';
export declare function ethersInterfaceFromSpec(spec: FakeContractSpec): Promise<ethers.utils.Interface>;
