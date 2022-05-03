import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { DeltaNeutralVaultConfig__factory, DeltaNeutralVaultGateway } from "../../../../typechain";
import { getConfig } from "../../../entities/config";
import { getDeployer } from "../../../../utils/deployer-helper";
import { UpgradeableContractDeployer } from "../../../deployer";
import { ConfigFileHelper } from "../../../helper";

interface IDeltaVaultInput {
  name: string;
}

interface IDeltaVaultInfo {
  name: string;
  address: string;
  deltaVaultConfig: string;
}

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
  // state
  const deployer = await getDeployer();

  const configFileHelper = new ConfigFileHelper();
  let config = configFileHelper.getConfig();

  // prepare
  const deltaVaultInputs: IDeltaVaultInput[] = [
    {
      name: "Market Neutral 3x BNB-USDT BS1",
    },
  ];

  const deltaVaultInfos: IDeltaVaultInfo[] = deltaVaultInputs.map((input) => {
    const deltaVaultInfo = config.DeltaNeutralVaults.find((deltaVault) => input.name === deltaVault.name);

    if (!deltaVaultInfo) throw new Error(`DeltaNeutralVault ${input.name} not found in config`);

    return {
      name: deltaVaultInfo.name,
      address: deltaVaultInfo.address,
      deltaVaultConfig: deltaVaultInfo.config,
    };
  });

  for (let i = 0; i < deltaVaultInfos.length; i++) {
    const deltaVaultInfo = deltaVaultInfos[i];
    const deltaVaultGWDeployer = new UpgradeableContractDeployer<DeltaNeutralVaultGateway>(
      deployer,
      "DeltaNeutralVaultGateway",
      deltaVaultInputs[i].name
    );

    const { contract: deltaNeutralVaultGateway } = await deltaVaultGWDeployer.deploy([deltaVaultInfo.address]);

    console.log(`>> Setting DeltaNeutralConfig's WhitelistCallers for DeltaNeutralVaultGateway`);
    const deltaNeutralVaultConfig = DeltaNeutralVaultConfig__factory.connect(deltaVaultInfo.deltaVaultConfig, deployer);
    await deltaNeutralVaultConfig.setWhitelistedCallers([deltaNeutralVaultGateway.address], true);
    console.log("✅ Done");

    config = configFileHelper.setDeltaNeutralGateway(deltaVaultInfo.name, deltaNeutralVaultGateway.address);
  }
};

export default func;
func.tags = ["BiswapDeltaNeutralVaultGateway"];
