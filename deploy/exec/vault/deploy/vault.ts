import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  DebtToken,
  DebtToken__factory,
  Timelock,
  Timelock__factory,
  Vault,
  Vault__factory,
  WNativeRelayer,
  WNativeRelayer__factory,
} from "../../../../typechain";
import { ethers, upgrades } from "hardhat";
import { ConfigEntity } from "../../../entities";

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

  const ALLOC_POINT_FOR_DEPOSIT = 0;
  const ALLOC_POINT_FOR_OPEN_POSITION = 0;
  const VAULT_NAME = "USDC Vault";
  const NAME = "Interest Bearing USDC";
  const SYMBOL = "ibUSDC";
  const DEBT_FAIR_LAUNCH_PID = "23";
  const EXACT_ETA = "1641628800";

  const config = ConfigEntity.getConfig();
  const deployer = (await ethers.getSigners())[0];
  const targetedVault = config.Vaults.find((v) => v.symbol === SYMBOL);
  if (targetedVault === undefined) {
    throw `error: not found any vault with ${SYMBOL} symbol`;
  }
  if (targetedVault.config === "") {
    throw `error: not config address`;
  }

  const tokenList: any = config.Tokens;
  const baseTokenAddr = tokenList[SYMBOL.replace("ib", "")];
  if (baseTokenAddr === undefined) {
    throw `error: not found ${SYMBOL.replace("ib", "")} in tokenList`;
  }

  console.log(`>> Deploying debt${SYMBOL}`);
  const DebtToken = (await ethers.getContractFactory(
    "DebtToken",
    (
      await ethers.getSigners()
    )[0]
  )) as DebtToken__factory;
  // const debtToken = (await upgrades.deployProxy(DebtToken, [
  //   `debt${SYMBOL}_V2`,
  //   `debt${SYMBOL}_V2`,
  //   config.Timelock,
  // ])) as DebtToken;
  // await debtToken.deployed();
  const debtToken = DebtToken__factory.connect("0x426BdFE8cAB2c4720B36ABBdc3ff08144BC361f3", deployer);
  console.log(`>> Deployed at ${debtToken.address}`);

  console.log(`>> Deploying an upgradable Vault contract for ${VAULT_NAME}`);
  const Vault = (await ethers.getContractFactory("Vault", (await ethers.getSigners())[0])) as Vault__factory;
  // const vault = (await upgrades.deployProxy(Vault, [
  //   targetedVault.config,
  //   baseTokenAddr,
  //   NAME,
  //   SYMBOL,
  //   18,
  //   debtToken.address,
  // ])) as Vault;
  // await vault.deployed();
  const vault = Vault__factory.connect("0x800933D685E7Dc753758cEb77C8bd34aBF1E26d7", deployer);
  console.log(`>> Deployed at ${vault.address}`);

  let nonce = await deployer.getTransactionCount();

  console.log(">> Set okHolders on DebtToken to be be Vault");
  await debtToken.setOkHolders([vault.address, config.FairLaunch!.address], true, { nonce: nonce++ });
  console.log("✅ Done");

  console.log(">> Transferring ownership of debtToken to Vault");
  await debtToken.transferOwnership(vault.address, { nonce: nonce++ });
  console.log("✅ Done");

  const timelock = Timelock__factory.connect(config.Timelock, (await ethers.getSigners())[0]) as Timelock;

  console.log(">> Queue Transaction to add a debtToken pool through Timelock");
  await timelock.queueTransaction(
    config.Shield!,
    "0",
    "addPool(uint256,address,bool)",
    ethers.utils.defaultAbiCoder.encode(
      ["uint256", "address", "bool"],
      [ALLOC_POINT_FOR_OPEN_POSITION, debtToken.address, true]
    ),
    EXACT_ETA,
    { nonce: nonce++ }
  );
  console.log("✅ Done");

  console.log(">> Generate timelock executeTransaction");
  console.log(
    `await timelock.executeTransaction('${config.Shield}', '0', 'addPool(uint256,address,bool)', ethers.utils.defaultAbiCoder.encode(['uint256','address','bool'], [${ALLOC_POINT_FOR_OPEN_POSITION}, '${debtToken.address}', true]), ${EXACT_ETA})`
  );
  console.log("✅ Done");

  console.log(">> Sleep for 10000msec waiting for fairLaunch to update the pool");
  await new Promise((resolve) => setTimeout(resolve, 10000));
  console.log("✅ Done");

  console.log(">> link pool with vault");
  await vault.setFairLaunchPoolId(DEBT_FAIR_LAUNCH_PID, { gasLimit: "2000000", nonce: nonce++ });
  console.log("✅ Done");

  console.log(`>> Queue Transaction to add a ${SYMBOL} pool through Timelock`);
  await timelock.queueTransaction(
    config.Shield!,
    "0",
    "addPool(uint256,address,bool)",
    ethers.utils.defaultAbiCoder.encode(["uint256", "address", "bool"], [ALLOC_POINT_FOR_DEPOSIT, vault.address, true]),
    EXACT_ETA,
    { nonce: nonce++ }
  );
  console.log("✅ Done");

  console.log(">> Generate timelock executeTransaction");
  console.log(
    `await timelock.executeTransaction('${config.Shield}', '0', 'addPool(uint256,address,bool)', ethers.utils.defaultAbiCoder.encode(['uint256','address','bool'], [${ALLOC_POINT_FOR_DEPOSIT}, '${vault.address}', true]), ${EXACT_ETA})`
  );
  console.log("✅ Done");

  const wNativeRelayer = WNativeRelayer__factory.connect(
    config.SharedConfig.WNativeRelayer,
    (await ethers.getSigners())[0]
  ) as WNativeRelayer;

  console.log(">> Whitelisting Vault on WNativeRelayer Contract");
  await wNativeRelayer.setCallerOk([vault.address], true, { nonce: nonce++ });
  console.log("✅ Done");
};

export default func;
func.tags = ["Vault"];
