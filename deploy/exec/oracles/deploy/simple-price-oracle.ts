import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { SimplePriceOracle__factory } from "../../../../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
  ░██╗░░░░░░░██╗░█████╗░██████╗░███╗░░██╗██╗███╗░░██╗░██████╗░
  ░██║░░██╗░░██║██╔══██╗██╔══██╗████╗░██║██║████╗░██║██╔════╝░
  ░╚██╗████╗██╔╝███████║██████╔╝██╔██╗██║██║██╔██╗██║██║░░██╗░
  ░░████╔═████║░██╔══██║██╔══██╗██║╚████║██║██║╚████║██║░░╚██╗
  ░░╚██╔╝░╚██╔╝░██║░░██║██║░░██║██║░╚███║██║██║░╚███║╚██████╔╝
  ░░░╚═╝░░░╚═╝░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝╚═╝░░╚══╝░╚═════╝░
  Check all variables below before execute the deployment script
  */
  const FEEDER_ADDR = "0x02b5a4c9c6A2D267B8fF4cFE62b6C8A8e7d74a6f";

  console.log(">> Deploying an upgradable SimplePriceOracle contract");
  const SimplePriceOracle = (await ethers.getContractFactory(
    "SimplePriceOracle",
    (
      await ethers.getSigners()
    )[0]
  )) as SimplePriceOracle__factory;
  const simplePriceOracle = await upgrades.deployProxy(SimplePriceOracle, [FEEDER_ADDR]);
  await simplePriceOracle.deployed();
  console.log(`>> Deployed at ${simplePriceOracle.address}`);
};

export default func;
func.tags = ["SimpleOracle"];
