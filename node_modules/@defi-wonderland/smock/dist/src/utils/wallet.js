"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impersonate = void 0;
const hardhat_1 = require("hardhat");
const impersonate = async (address) => {
    await hardhat_1.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
    });
    return hardhat_1.ethers.provider.getSigner(address);
};
exports.impersonate = impersonate;
//# sourceMappingURL=wallet.js.map