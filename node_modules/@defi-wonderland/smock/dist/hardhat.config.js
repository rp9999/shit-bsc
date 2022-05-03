"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@typechain/hardhat");
require("@typechain/hardhat/dist/type-extensions");
require("tsconfig-paths/register");
const config = {
    paths: {
        sources: './test/contracts',
    },
    solidity: {
        version: '0.8.4',
        settings: {
            outputSelection: {
                '*': {
                    '*': ['storageLayout'],
                },
            },
        },
    },
    typechain: {
        outDir: 'typechained',
        target: 'ethers-v5',
    },
};
exports.default = config;
//# sourceMappingURL=hardhat.config.js.map