import { JsonRpcSigner } from '@ethersproject/providers';
export declare const impersonate: (address: string) => Promise<JsonRpcSigner>;
