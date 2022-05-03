// SPDX-License-Identifier: BUSL
/**
  ∩~~~~∩ 
  ξ ･×･ ξ 
  ξ　~　ξ 
  ξ　　 ξ 
  ξ　　 “~～~～〇 
  ξ　　　　　　 ξ 
  ξ ξ ξ~～~ξ ξ ξ 
　 ξ_ξξ_ξ　ξ_ξξ_ξ
Alpaca Fin Corporation
*/

pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IDeltaNeutralVaultConfig.sol";

/// @title DeltaNeutralVaultConfig - A place where you can find all delta neutral vault config
// solhint-disable max-states-count
contract DeltaNeutralVaultConfig is IDeltaNeutralVaultConfig, OwnableUpgradeable {
  /// @dev Events
  event LogSetParams(
    address indexed _caller,
    address _getWrappedNativeAddr,
    address _getWNativeRelayer,
    address _fairLaunchAddr,
    uint256 _rebalanceFactor,
    uint256 _positionValueTolerance,
    uint256 _debtRatioTolerance
  );
  event LogSetWhitelistedCallers(address indexed _caller, address indexed _address, bool _ok);
  event LogSetWhitelistedRebalancers(address indexed _caller, address indexed _address, bool _ok);
  event LogSetFeeExemptedCallers(address indexed _caller, address indexed _address, bool _ok);
  event LogSetSwapRoute(address indexed _caller, address indexed _swapRouter, address source, address destination);
  event LogSetLeverageLevel(address indexed _caller, uint8 _newLeverageLevel);
  event LogSetAlpacaBountyConfig(address indexed _caller, address _alpacaReinvestTreasury, uint256 _alpacaBountyBps);
  event LogSetAlpacaBeneficiaryConfig(
    address indexed _caller,
    address _alpacaBeneficiary,
    uint256 _alpacaBeneficiaryBps
  );
  event LogSetWhitelistedReinvestors(address indexed _caller, address indexed _address, bool _ok);
  event LogSetValueLimit(address indexed _caller, uint256 _maxVaultPositionValue);
  event LogSetFees(
    address indexed _caller,
    uint256 _depositFeeBps,
    uint256 _withdrawalFeeBps,
    uint256 _managementFeePerSec
  );
  event LogSetFeeTreasury(
    address indexed _caller,
    address _depositFeeTreasury,
    address _withdrawFeeTreasury,
    address _managementFeeTreasury
  );
  event LogSetSwapRouter(address indexed _caller, address _swapRouter);
  event LogSetReinvestPath(address indexed _caller, address[] _reinvestPath);

  /// @dev Errors
  error DeltaNeutralVaultConfig_LeverageLevelTooLow();
  error DeltaNeutralVaultConfig_TooMuchFee(uint256 _depositFeeBps, uint256 _withdrawalFeeBps, uint256 _mangementFeeBps);
  error DeltaNeutralVaultConfig_TooMuchBounty(uint256 _bounty);
  error DeltaNeutralVaultConfig_InvalidSwapRouter();
  error DeltaNeutralVaultConfig_InvalidReinvestPath();
  error DeltaNeutralVaultConfig_InvalidReinvestPathLength();

  /// @notice Constants
  uint8 private constant MIN_LEVERAGE_LEVEL = 3;
  uint256 private constant MAX_DEPOSIT_FEE_BPS = 1000;
  uint256 private constant MAX_WITHDRAWAL_FEE_BPS = 1000;
  uint256 private constant MAX_MANGEMENT_FEE_PER_SEC = 3170979198;
  uint256 private constant MAX_ALPACA_BOUNTY_BPS = 2500;
  uint256 private constant MAX_ALPACA_BENEFICIARY_BPS = 6000;

  /// @notice Configuration for Delta Neutral Vault
  /// @notice Address for wrapped native eg WBNB, WETH
  address public override getWrappedNativeAddr;
  /// @notice Address for wNtive Relayer
  address public override getWNativeRelayer;
  /// @notice FairLaunch contract address
  address public fairLaunchAddr;

  /// @notice The maximum position value in USD that can be held in the vault
  uint256 public maxVaultPositionValue;
  /// @notice If debt ratio went above rebalanceFactor, then rebalance
  uint256 public override rebalanceFactor;
  /// @notice Tolerance bps that allow margin for misc calculation
  uint256 public override positionValueTolerance;
  /// @notice Specific Tolerance bps use for debt ratio check during withdraw
  uint256 public override debtRatioTolerance;

  /// @notice Deposit fee treasury.
  address public depositFeeTreasury;
  /// @notice Fee when user deposit to delta neutral vault
  uint256 public override depositFeeBps;
  /// @notice Withdrawal fee treasury.
  address public withdrawalFeeTreasury;
  /// @notice Fee when user withdraw from delta neutral vault
  uint256 public override withdrawalFeeBps;
  /// @notice Management fee treausry.
  address public managementFeeTreasury;
  /// @notice Management fee when users is using the vault
  uint256 public override managementFeePerSec;

  /// @notice Targeted leverage level used for underlying positions
  uint8 public override leverageLevel;

  /// @notice ALPACA token
  address public alpacaToken;
  /// @notice The router to be used for swaping ALPACA to other assets
  address public getSwapRouter;
  /// @notice The path to be used for reinvesting
  address[] public reinvestPath;

  /// @notice Mapping of whitelisted callers
  mapping(address => bool) public whitelistedCallers;
  /// @notice Mapping of whitelisted rebalancers
  mapping(address => bool) public whitelistedRebalancers;

  /// @notice list of exempted callers.
  mapping(address => bool) public feeExemptedCallers;

  /// @notice list of reinvestors
  mapping(address => bool) public whitelistedReinvestors;

  /// @notice ALPACA treausry
  address public alpacaReinvestFeeTreasury;
  /// @notice ALPACA bounty percentage.
  uint256 public alpacaBountyBps;
  /// @notice ALPACA beneficiary. This is the address that will receive portion of the bounty.
  address public alpacaBeneficiary;
  /// @notice ALPACA beneficiary percentage.
  uint256 public alpacaBeneficiaryBps;

  function initialize(
    address _getWrappedNativeAddr,
    address _getWNativeRelayer,
    address _fairLaunchAddr,
    uint256 _rebalanceFactor,
    uint256 _positionValueTolerance,
    uint256 _debtRatioTolerance,
    address _depositFeeTreasury,
    address _managementFeeTreasury,
    address _withdrawFeeTreasury,
    address _alpacaToken
  ) external initializer {
    OwnableUpgradeable.__Ownable_init();

    alpacaToken = _alpacaToken;

    setFees(_depositFeeTreasury, 0, _withdrawFeeTreasury, 0, _managementFeeTreasury, 0);
    setParams(
      _getWrappedNativeAddr,
      _getWNativeRelayer,
      _fairLaunchAddr,
      _rebalanceFactor,
      _positionValueTolerance,
      _debtRatioTolerance
    );
  }

  function setParams(
    address _getWrappedNativeAddr,
    address _getWNativeRelayer,
    address _fairLaunchAddr,
    uint256 _rebalanceFactor,
    uint256 _positionValueTolerance,
    uint256 _debtRatioTolerance
  ) public onlyOwner {
    getWrappedNativeAddr = _getWrappedNativeAddr;
    getWNativeRelayer = _getWNativeRelayer;
    fairLaunchAddr = _fairLaunchAddr;
    rebalanceFactor = _rebalanceFactor;
    positionValueTolerance = _positionValueTolerance;
    debtRatioTolerance = _debtRatioTolerance;

    emit LogSetParams(
      msg.sender,
      _getWrappedNativeAddr,
      _getWNativeRelayer,
      _fairLaunchAddr,
      _rebalanceFactor,
      _positionValueTolerance,
      _debtRatioTolerance
    );
  }

  /// @notice Set whitelisted callers.
  /// @dev Must only be called by owner.
  /// @param _callers addresses to be whitelisted.
  /// @param _ok The new ok flag for callers.
  function setWhitelistedCallers(address[] calldata _callers, bool _ok) external onlyOwner {
    for (uint256 _idx = 0; _idx < _callers.length; _idx++) {
      whitelistedCallers[_callers[_idx]] = _ok;
      emit LogSetWhitelistedCallers(msg.sender, _callers[_idx], _ok);
    }
  }

  /// @notice Set whitelisted rebalancers.
  /// @dev Must only be called by owner.
  /// @param _callers addresses to be whitelisted.
  /// @param _ok The new ok flag for callers.
  function setWhitelistedRebalancer(address[] calldata _callers, bool _ok) external onlyOwner {
    for (uint256 _idx = 0; _idx < _callers.length; _idx++) {
      whitelistedRebalancers[_callers[_idx]] = _ok;
      emit LogSetWhitelistedRebalancers(msg.sender, _callers[_idx], _ok);
    }
  }

  /// @notice Set whitelisted reinvestors.
  /// @dev Must only be called by owner.
  /// @param _callers addresses to be whitelisted.
  /// @param _ok The new ok flag for callers.
  function setwhitelistedReinvestors(address[] calldata _callers, bool _ok) external onlyOwner {
    for (uint256 _idx = 0; _idx < _callers.length; _idx++) {
      whitelistedReinvestors[_callers[_idx]] = _ok;
      emit LogSetWhitelistedReinvestors(msg.sender, _callers[_idx], _ok);
    }
  }

  /// @notice Set leverage level.
  /// @dev Must only be called by owner.
  /// @param _newLeverageLevel The new leverage level to be set. Must be >= 3
  function setLeverageLevel(uint8 _newLeverageLevel) external onlyOwner {
    if (_newLeverageLevel < MIN_LEVERAGE_LEVEL) {
      revert DeltaNeutralVaultConfig_LeverageLevelTooLow();
    }
    leverageLevel = _newLeverageLevel;
    emit LogSetLeverageLevel(msg.sender, _newLeverageLevel);
  }

  /// @notice Set exempted fee callers.
  /// @dev Must only be called by owner.
  /// @param _callers addresses to be exempted.
  /// @param _ok The new ok flag for callers.
  function setFeeExemptedCallers(address[] calldata _callers, bool _ok) external onlyOwner {
    for (uint256 _idx = 0; _idx < _callers.length; _idx++) {
      feeExemptedCallers[_callers[_idx]] = _ok;
      emit LogSetFeeExemptedCallers(msg.sender, _callers[_idx], _ok);
    }
  }

  /// @notice Set fees.
  /// @dev Must only be called by owner.
  /// @param _newDepositFeeBps Fee when user deposit to delta neutral vault.
  /// @param _newWithdrawalFeeBps Fee when user deposit to delta neutral vault.
  /// @param _newManagementFeePerSec Mangement Fee per second.
  function setFees(
    address _newDepositFeeTreasury,
    uint256 _newDepositFeeBps,
    address _newWithdrawalFeeTreasury,
    uint256 _newWithdrawalFeeBps,
    address _newManagementFeeTreasury,
    uint256 _newManagementFeePerSec
  ) public onlyOwner {
    if (
      _newDepositFeeBps > MAX_DEPOSIT_FEE_BPS ||
      _newWithdrawalFeeBps > MAX_WITHDRAWAL_FEE_BPS ||
      _newManagementFeePerSec > MAX_MANGEMENT_FEE_PER_SEC
    ) {
      revert DeltaNeutralVaultConfig_TooMuchFee(_newDepositFeeBps, _newWithdrawalFeeBps, _newManagementFeePerSec);
    }

    depositFeeTreasury = _newDepositFeeTreasury;
    depositFeeBps = _newDepositFeeBps;

    withdrawalFeeTreasury = _newWithdrawalFeeTreasury;
    withdrawalFeeBps = _newWithdrawalFeeBps;

    managementFeeTreasury = _newManagementFeeTreasury;
    managementFeePerSec = _newManagementFeePerSec;

    emit LogSetFees(msg.sender, _newDepositFeeBps, _newWithdrawalFeeBps, _newManagementFeePerSec);
    emit LogSetFeeTreasury(msg.sender, _newDepositFeeTreasury, _newWithdrawalFeeTreasury, _newManagementFeeTreasury);
  }

  /// @notice Set alpacaBountyBps.
  /// @dev Must only be called by owner.
  /// @param _newAlpacaReinvestFeeTreasury The new address to received ALPACA reinvest fee
  /// @param _newAlpacaBountyBps Fee from reinvesting ALPACA to positions.
  function setAlpacaBountyConfig(address _newAlpacaReinvestFeeTreasury, uint256 _newAlpacaBountyBps)
    external
    onlyOwner
  {
    if (_newAlpacaBountyBps > MAX_ALPACA_BOUNTY_BPS) {
      revert DeltaNeutralVaultConfig_TooMuchBounty(_newAlpacaBountyBps);
    }

    alpacaReinvestFeeTreasury = _newAlpacaReinvestFeeTreasury;
    alpacaBountyBps = _newAlpacaBountyBps;

    emit LogSetAlpacaBountyConfig(msg.sender, alpacaReinvestFeeTreasury, alpacaBountyBps);
  }

  /// @notice Set alpacaBeneficiaryBps.
  /// @dev Must only be called by owner.
  /// @param _newAlpacaBeneficiary The new address to received ALPACA reinvest fee
  /// @param _newAlpacaBeneficiaryBps Fee from reinvesting ALPACA to positions.
  function setAlpacaBeneficiaryConfig(address _newAlpacaBeneficiary, uint256 _newAlpacaBeneficiaryBps)
    external
    onlyOwner
  {
    if (_newAlpacaBeneficiaryBps > MAX_ALPACA_BENEFICIARY_BPS) {
      revert DeltaNeutralVaultConfig_TooMuchBounty(_newAlpacaBeneficiaryBps);
    }

    alpacaBeneficiary = _newAlpacaBeneficiary;
    alpacaBeneficiaryBps = _newAlpacaBeneficiaryBps;

    emit LogSetAlpacaBeneficiaryConfig(msg.sender, alpacaBeneficiary, alpacaBeneficiaryBps);
  }

  /// @notice Set position value limit.
  /// @dev Must only be called by owner.
  /// @param _maxVaultPositionValue Maximum vault size position value.
  function setValueLimit(uint256 _maxVaultPositionValue) external onlyOwner {
    maxVaultPositionValue = _maxVaultPositionValue;
    emit LogSetValueLimit(msg.sender, _maxVaultPositionValue);
  }

  /// @notice Return if vault can accept new position value.
  /// @param _totalPositionValue new vault position value.
  function isVaultSizeAcceptable(uint256 _totalPositionValue) external view returns (bool) {
    if (_totalPositionValue > maxVaultPositionValue) {
      return false;
    }
    return true;
  }

  /// @dev Set the reinvest configuration.
  /// @param _swapRouter - The router address to update.
  function setSwapRouter(address _swapRouter) external onlyOwner {
    if (_swapRouter == address(0)) revert DeltaNeutralVaultConfig_InvalidSwapRouter();
    getSwapRouter = _swapRouter;
    emit LogSetSwapRouter(msg.sender, _swapRouter);
  }

  /// @dev Set the reinvest path.
  /// @param _reinvestPath - The reinvest path to update.
  function setReinvestPath(address[] calldata _reinvestPath) external onlyOwner {
    if (_reinvestPath.length < 2) revert DeltaNeutralVaultConfig_InvalidReinvestPathLength();

    if (_reinvestPath[0] != alpacaToken) revert DeltaNeutralVaultConfig_InvalidReinvestPath();

    reinvestPath = _reinvestPath;
    emit LogSetReinvestPath(msg.sender, _reinvestPath);
  }

  /// @dev Get the reinvest path.
  function getReinvestPath() external view returns (address[] memory) {
    return reinvestPath;
  }
}
