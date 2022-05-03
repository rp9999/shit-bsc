import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import '@typechain/hardhat/dist/type-extensions';
import { HardhatUserConfig } from 'hardhat/config';
import 'tsconfig-paths/register';
declare const config: HardhatUserConfig;
export default config;
