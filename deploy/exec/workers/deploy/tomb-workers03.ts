import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import {
  ConfigurableInterestVaultConfig__factory,
  PancakeswapV2RestrictedStrategyAddBaseTokenOnly__factory,
  PancakeswapV2RestrictedStrategyAddTwoSidesOptimal__factory,
  PancakeswapV2RestrictedStrategyLiquidate__factory,
  PancakeswapV2RestrictedStrategyPartialCloseLiquidate__factory,
  PancakeswapV2RestrictedStrategyWithdrawMinimizeTrading__factory,
  Timelock__factory,
  TombWorker03,
  TombWorker03__factory,
  WorkerConfig__factory,
} from "../../../../typechain";
import { ConfigEntity } from "../../../entities";

interface IBeneficialVaultInput {
  BENEFICIAL_VAULT_BPS: string;
  BENEFICIAL_VAULT_ADDRESS: string;
  REWARD_PATH: Array<string>;
}

interface ITombWorkerInput {
  VAULT_SYMBOL: string;
  WORKER_NAME: string;
  REINVEST_BOT: string;
  POOL_ID: number;
  REINVEST_BOUNTY_BPS: string;
  REINVEST_PATH: Array<string>;
  REINVEST_THRESHOLD: string;
  WORK_FACTOR: string;
  KILL_FACTOR: string;
  MAX_PRICE_DIFF: string;
  BENEFICIAL_VAULT?: IBeneficialVaultInput;
  EXACT_ETA: string;
}

interface ITombWorkerInfo {
  WORKER_NAME: string;
  VAULT_CONFIG_ADDR: string;
  WORKER_CONFIG_ADDR: string;
  REINVEST_BOT: string;
  POOL_ID: number;
  VAULT_ADDR: string;
  BASE_TOKEN_ADDR: string;
  MASTER_CHEF_ADDR: string;
  ROUTER_ADDR: string;
  ADD_STRAT_ADDR: string;
  LIQ_STRAT_ADDR: string;
  TWO_SIDES_STRAT_ADDR: string;
  PARTIAL_CLOSE_LIQ_STRAT_ADDR: string;
  PARTIAL_CLOSE_MINIMIZE_STRAT_ADDR: string;
  MINIMIZE_TRADE_STRAT_ADDR: string;
  REINVEST_BOUNTY_BPS: string;
  REINVEST_PATH: Array<string>;
  REINVEST_THRESHOLD: string;
  WORK_FACTOR: string;
  KILL_FACTOR: string;
  MAX_PRICE_DIFF: string;
  BENEFICIAL_VAULT?: IBeneficialVaultInput;
  TIMELOCK: string;
  EXACT_ETA: string;
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
  const shortWorkerInfos: ITombWorkerInput[] = [
    // {
    //   VAULT_SYMBOL: "ibFTM",
    //   WORKER_NAME: "TOMB-WFTM TombWorker",
    //   REINVEST_BOT: "0xe45216Ac4816A5Ec5378B1D13dE8aA9F262ce9De",
    //   POOL_ID: 0,
    //   REINVEST_BOUNTY_BPS: "900",
    //   REINVEST_PATH: ["TSHARE", "WFTM"],
    //   REINVEST_THRESHOLD: "0",
    //   WORK_FACTOR: "7800",
    //   KILL_FACTOR: "9000",
    //   MAX_PRICE_DIFF: "11000",
    //   EXACT_ETA: "88888888", // no use due to no timelock
    // },
    // {
    //   VAULT_SYMBOL: "ibTOMB",
    //   WORKER_NAME: "WFTM-TOMB TombWorker",
    //   REINVEST_BOT: "0xe45216Ac4816A5Ec5378B1D13dE8aA9F262ce9De",
    //   POOL_ID: 0,
    //   REINVEST_BOUNTY_BPS: "900",
    //   REINVEST_PATH: ["TSHARE", "WFTM", "TOMB"],
    //   REINVEST_THRESHOLD: "0",
    //   WORK_FACTOR: "7800",
    //   KILL_FACTOR: "9000",
    //   MAX_PRICE_DIFF: "11000",
    //   EXACT_ETA: "88888888", // no use due to no timelock
    // },
    {
      VAULT_SYMBOL: "ibFTM",
      WORKER_NAME: "TSHARE-WFTM TombWorker",
      REINVEST_BOT: "0xe45216Ac4816A5Ec5378B1D13dE8aA9F262ce9De",
      POOL_ID: 1,
      REINVEST_BOUNTY_BPS: "900",
      REINVEST_PATH: ["TSHARE", "WFTM"],
      REINVEST_THRESHOLD: "0",
      WORK_FACTOR: "7000",
      KILL_FACTOR: "8333",
      MAX_PRICE_DIFF: "11000",
      EXACT_ETA: "88888888", // no use due to no timelock
    },
  ];

  const [deployer] = await ethers.getSigners();
  const config = ConfigEntity.getConfig();
  const workerInfos: ITombWorkerInfo[] = shortWorkerInfos.map((n) => {
    const vault = config.Vaults.find((v) => v.symbol === n.VAULT_SYMBOL);
    if (vault === undefined) {
      throw `error: unable to find vault from ${n.VAULT_SYMBOL}`;
    }

    const tokenList: any = config.Tokens;
    const reinvestPath: Array<string> = n.REINVEST_PATH.map((p) => {
      const addr = tokenList[p];
      if (addr === undefined) {
        throw `error: path: unable to find address of ${p}`;
      }
      return addr;
    });

    const beneficialVault = n.BENEFICIAL_VAULT;
    if (beneficialVault !== undefined) {
      beneficialVault.REWARD_PATH = beneficialVault.REWARD_PATH.map((p) => {
        const addr = tokenList[p];
        if (addr === undefined) {
          throw `error: path: unable to find address of ${p}`;
        }
        return addr;
      });
    }

    return {
      WORKER_NAME: n.WORKER_NAME,
      VAULT_CONFIG_ADDR: vault.config,
      WORKER_CONFIG_ADDR: config.SharedConfig.WorkerConfig,
      REINVEST_BOT: n.REINVEST_BOT,
      POOL_ID: n.POOL_ID,
      VAULT_ADDR: vault.address,
      BASE_TOKEN_ADDR: vault.baseToken,
      MASTER_CHEF_ADDR: config.YieldSources.TombFinance!.TShareRewardPool,
      ROUTER_ADDR: config.YieldSources.SpookySwap!.SpookyRouter,
      ADD_STRAT_ADDR: config.SharedStrategies.SpookySwap!.StrategyAddBaseTokenOnly,
      LIQ_STRAT_ADDR: config.SharedStrategies.SpookySwap!.StrategyLiquidate,
      TWO_SIDES_STRAT_ADDR: vault.StrategyAddTwoSidesOptimal.SpookySwap!,
      PARTIAL_CLOSE_LIQ_STRAT_ADDR: config.SharedStrategies.SpookySwap!.StrategyPartialCloseLiquidate,
      PARTIAL_CLOSE_MINIMIZE_STRAT_ADDR: config.SharedStrategies.SpookySwap!.StrategyPartialCloseMinimizeTrading,
      MINIMIZE_TRADE_STRAT_ADDR: config.SharedStrategies.SpookySwap!.StrategyWithdrawMinimizeTrading,
      REINVEST_BOUNTY_BPS: n.REINVEST_BOUNTY_BPS,
      REINVEST_PATH: reinvestPath,
      REINVEST_THRESHOLD: ethers.utils.parseEther(n.REINVEST_THRESHOLD).toString(),
      WORK_FACTOR: n.WORK_FACTOR,
      KILL_FACTOR: n.KILL_FACTOR,
      MAX_PRICE_DIFF: n.MAX_PRICE_DIFF,
      BENEFICIAL_VAULT: beneficialVault,
      TIMELOCK: config.Timelock,
      EXACT_ETA: n.EXACT_ETA,
    };
  });

  for (let i = 0; i < workerInfos.length; i++) {
    console.log("===================================================================================");
    console.log(`>> Deploying an upgradable TombWorker03 contract for ${workerInfos[i].WORKER_NAME}`);
    const TombWorker03 = (await ethers.getContractFactory("TombWorker03", deployer)) as TombWorker03__factory;
    const tombWorker03 = (await upgrades.deployProxy(TombWorker03, [
      workerInfos[i].VAULT_ADDR,
      workerInfos[i].BASE_TOKEN_ADDR,
      workerInfos[i].MASTER_CHEF_ADDR,
      workerInfos[i].ROUTER_ADDR,
      workerInfos[i].POOL_ID,
      workerInfos[i].ADD_STRAT_ADDR,
      workerInfos[i].LIQ_STRAT_ADDR,
      workerInfos[i].REINVEST_BOUNTY_BPS,
      workerInfos[i].REINVEST_BOT,
      workerInfos[i].REINVEST_PATH,
      workerInfos[i].REINVEST_THRESHOLD,
    ])) as TombWorker03;
    const deployedTx = await tombWorker03.deployTransaction.wait(3);
    console.log(`>> Deployed at ${tombWorker03.address}`);
    console.log(`>> Deployed block: ${deployedTx.blockNumber}`);

    console.log(">> Waiting for TombWorker03 to be ready...");
    await new Promise((f) => setTimeout(f, 10000));
    console.log(">> Done");

    let nonce = await deployer.getTransactionCount();

    console.log(`>> Adding REINVEST_BOT`);
    await tombWorker03.setReinvestorOk([workerInfos[i].REINVEST_BOT], true, { nonce: nonce++ });
    console.log("✅ Done");

    console.log(`>> Adding Strategies`);
    const okStrats = [workerInfos[i].TWO_SIDES_STRAT_ADDR, workerInfos[i].MINIMIZE_TRADE_STRAT_ADDR];
    if (workerInfos[i].PARTIAL_CLOSE_LIQ_STRAT_ADDR != "") {
      okStrats.push(workerInfos[i].PARTIAL_CLOSE_LIQ_STRAT_ADDR);
    }
    if (workerInfos[i].PARTIAL_CLOSE_MINIMIZE_STRAT_ADDR != "") {
      okStrats.push(workerInfos[i].PARTIAL_CLOSE_MINIMIZE_STRAT_ADDR);
    }
    await tombWorker03.setStrategyOk(okStrats, true, { nonce: nonce++ });
    console.log("✅ Done");

    // The following step use PCS typechain due to they share the same interface
    console.log(`>> Whitelisting a worker on strats`);
    const addStrat = PancakeswapV2RestrictedStrategyAddBaseTokenOnly__factory.connect(
      workerInfos[i].ADD_STRAT_ADDR,
      deployer
    );
    await addStrat.setWorkersOk([tombWorker03.address], true, { nonce: nonce++ });

    const liqStrat = PancakeswapV2RestrictedStrategyLiquidate__factory.connect(workerInfos[i].LIQ_STRAT_ADDR, deployer);
    await liqStrat.setWorkersOk([tombWorker03.address], true, { nonce: nonce++ });

    const twoSidesStrat = PancakeswapV2RestrictedStrategyAddTwoSidesOptimal__factory.connect(
      workerInfos[i].TWO_SIDES_STRAT_ADDR,
      deployer
    );
    await twoSidesStrat.setWorkersOk([tombWorker03.address], true, { nonce: nonce++ });

    const minimizeStrat = PancakeswapV2RestrictedStrategyWithdrawMinimizeTrading__factory.connect(
      workerInfos[i].MINIMIZE_TRADE_STRAT_ADDR,
      deployer
    );
    await minimizeStrat.setWorkersOk([tombWorker03.address], true, { nonce: nonce++ });

    if (workerInfos[i].PARTIAL_CLOSE_LIQ_STRAT_ADDR != "") {
      console.log(">> partial close liquidate is deployed");
      const partialCloseLiquidate = PancakeswapV2RestrictedStrategyPartialCloseLiquidate__factory.connect(
        workerInfos[i].PARTIAL_CLOSE_LIQ_STRAT_ADDR,
        deployer
      );
      await partialCloseLiquidate.setWorkersOk([tombWorker03.address], true, { nonce: nonce++ });
    }

    if (workerInfos[i].PARTIAL_CLOSE_MINIMIZE_STRAT_ADDR != "") {
      console.log(">> partial close minimize is deployed");
      const partialCloseMinimize = PancakeswapV2RestrictedStrategyWithdrawMinimizeTrading__factory.connect(
        workerInfos[i].PARTIAL_CLOSE_MINIMIZE_STRAT_ADDR,
        deployer
      );
      await partialCloseMinimize.setWorkersOk([tombWorker03.address], true, { nonce: nonce++ });
    }
    console.log("✅ Done");

    if (workerInfos[i].BENEFICIAL_VAULT) {
      console.log(">> config baneficial vault");
      await tombWorker03.setBeneficialVaultConfig(
        workerInfos[i].BENEFICIAL_VAULT!.BENEFICIAL_VAULT_BPS,
        workerInfos[i].BENEFICIAL_VAULT!.BENEFICIAL_VAULT_ADDRESS,
        workerInfos[i].BENEFICIAL_VAULT!.REWARD_PATH,
        { nonce: nonce++ }
      );
      console.log("✅ Done");
    }

    const workerConfig = WorkerConfig__factory.connect(workerInfos[i].WORKER_CONFIG_ADDR, deployer);
    const vaultConfig = ConfigurableInterestVaultConfig__factory.connect(workerInfos[i].VAULT_CONFIG_ADDR, deployer);
    const timelock = Timelock__factory.connect(workerInfos[i].TIMELOCK, deployer);

    if ((await workerConfig.owner()).toLowerCase() === timelock.address.toLowerCase()) {
      console.log(">> Timelock: Setting WorkerConfig via Timelock");
      const setConfigsTx = await timelock.queueTransaction(
        workerInfos[i].WORKER_CONFIG_ADDR,
        "0",
        "setConfigs(address[],(bool,uint64,uint64,uint64)[])",
        ethers.utils.defaultAbiCoder.encode(
          ["address[]", "(bool acceptDebt,uint64 workFactor,uint64 killFactor,uint64 maxPriceDiff)[]"],
          [
            [tombWorker03.address],
            [
              {
                acceptDebt: true,
                workFactor: workerInfos[i].WORK_FACTOR,
                killFactor: workerInfos[i].KILL_FACTOR,
                maxPriceDiff: workerInfos[i].MAX_PRICE_DIFF,
              },
            ],
          ]
        ),
        workerInfos[i].EXACT_ETA,
        { nonce: nonce++ }
      );
      console.log(`queue setConfigs at: ${setConfigsTx.hash}`);
      console.log("generate timelock.executeTransaction:");
      console.log(
        `await timelock.executeTransaction('${workerInfos[i].WORKER_CONFIG_ADDR}', '0', 'setConfigs(address[],(bool,uint64,uint64,uint64)[])', ethers.utils.defaultAbiCoder.encode(['address[]','(bool acceptDebt,uint64 workFactor,uint64 killFactor,uint64 maxPriceDiff)[]'],[['${tombWorker03.address}'], [{acceptDebt: true, workFactor: ${workerInfos[i].WORK_FACTOR}, killFactor: ${workerInfos[i].KILL_FACTOR}, maxPriceDiff: ${workerInfos[i].MAX_PRICE_DIFF}}]]), ${workerInfos[i].EXACT_ETA})`
      );
      console.log("✅ Done");
    } else {
      console.log(">> Setting WorkerConfig");
      (
        await workerConfig.setConfigs(
          [tombWorker03.address],
          [
            {
              acceptDebt: true,
              workFactor: workerInfos[i].WORK_FACTOR,
              killFactor: workerInfos[i].KILL_FACTOR,
              maxPriceDiff: workerInfos[i].MAX_PRICE_DIFF,
            },
          ],
          { nonce: nonce++ }
        )
      ).wait(15);
      console.log("✅ Done");
    }

    if ((await vaultConfig.owner()).toLowerCase() === timelock.address.toLowerCase()) {
      console.log(">> Timelock: Linking VaultConfig with WorkerConfig via Timelock");
      const setWorkersTx = await timelock.queueTransaction(
        workerInfos[i].VAULT_CONFIG_ADDR,
        "0",
        "setWorkers(address[],address[])",
        ethers.utils.defaultAbiCoder.encode(
          ["address[]", "address[]"],
          [[tombWorker03.address], [workerInfos[i].WORKER_CONFIG_ADDR]]
        ),
        workerInfos[i].EXACT_ETA,
        { nonce: nonce++ }
      );
      console.log(`queue setWorkers at: ${setWorkersTx.hash}`);
      console.log("generate timelock.executeTransaction:");
      console.log(
        `await timelock.executeTransaction('${workerInfos[i].VAULT_CONFIG_ADDR}', '0','setWorkers(address[],address[])', ethers.utils.defaultAbiCoder.encode(['address[]','address[]'],[['${tombWorker03.address}'], ['${workerInfos[i].WORKER_CONFIG_ADDR}']]), ${workerInfos[i].EXACT_ETA})`
      );
      console.log("✅ Done");
    } else {
      console.log(">> Linking VaultConfig with WorkerConfig");
      (
        await vaultConfig.setWorkers([tombWorker03.address], [workerInfos[i].WORKER_CONFIG_ADDR], { nonce: nonce++ })
      ).wait(15);
      console.log("✅ Done");
    }
  }
};

export default func;
func.tags = ["TombWorkers03"];
