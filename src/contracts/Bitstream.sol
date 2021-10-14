// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Bitstream is Context, ERC20, AccessControlEnumerable {
    using Address for address;     
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant CLAIM_TEAM_REWARDS_ROLE =
        bytes32(uint256(1 * 8**64));
    uint256 public constant BLOCKS_BEFORE_HALVING = 10519200; // 1 Year
    uint256 public constant MAX_HALVING = 60;
    uint256 public constant REWARD_UMBRAL = 2**60;
    uint256 public TOKEN_DEPLOY_BLOCK = block.timestamp;
    //uint256 public constant STAKE_BLOCK_TIME = 201600; // 7 Days
    //uint256 public constant OPENLOOT_BLOCK_TIME = 1200; // 1 hour
    uint256 public constant STAKE_BLOCK_TIME = 0; // TEST
    uint256 public constant OPENLOOT_BLOCK_TIME = 0; // TEST
    uint256 private constant _MAX_UINT256 = ~uint256(0);
    uint256 private _randNonce = 0;
    uint256 public _lastRandom;

    // Accounts data
    mapping(address => uint256) private _streamKeys;
    EnumerableSet.UintSet private _enumerableStreamKeys;
    mapping(address => uint256) _openLootLastRewards;

    // Stakers info
    mapping(address => uint256) private _stakerBalances;
    EnumerableSet.AddressSet private _stakerAddresses;
    mapping(address => uint256) private _stakerBlockedTimes;
    uint256 private _stakersTotalBalance;

    // Bitstream team rewards
    uint256 private _bitstreamTokenRewards;

    modifier adminRole() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Only admin can access this function"
        );
        _;
    }

    modifier claimTeamRewardsRole() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) ||
                hasRole(CLAIM_TEAM_REWARDS_ROLE, _msgSender()),
            "Only Team Reward Claimers can access this function"
        );
        _;
    }



    modifier accountSettled(address _address) {
        require(isAccountSettled(_address), "Account not settled");
        _;
    }

    modifier ownAccountSettled() {
        require(isAccountSettled(_msgSender()), "Account not settled");
        _;
    }

    // Events
    event newAccount(address sender);
    event donation(address from, address to, uint256 value, string message);

    // Contructor
    constructor() ERC20("Bitream", "BSM") {
        // Set admin role to deployer's address
        _setupRole(0x00, _msgSender());
        // Add Address 0 too strakers (to avoid code fails)
        _stakerAddresses.add(address(0));
        uint256 _stakeInitialBalance = 1 * 10**decimals();
        _stakerBalances[address(0)] = _stakeInitialBalance;
        _stakersTotalBalance = _stakeInitialBalance;

        // Test calls
        address account1 = 0xffD93649c60BdeE0c83C8a8B94ACC212E48cD74b;
        uint256 amount1 = 25 * 10 ** decimals();
        address account2 = 0x5D39de1EFDB0d5398B1A0B47175B479cb0a46B16;
        uint256 amount2 = 500 * 10 ** decimals();

        _mint(account1, amount1);
        _setupAccount(account1);
        
        _mint(account2, amount2);
        _stake(account2, amount2/5);

    }

    function burn(uint256 _amount) public {
        _burn(_msgSender(), _amount);
    }

    function setupAccount() public {
        _setupAccount(_msgSender());
        _mint(_msgSender(), _randomReward());
        emit newAccount(_msgSender());
    }

    
    function isAccountSettled(address _address)
        public
        view
        returns (bool _accountSettled)
    {
        _accountSettled = (getRoleMemberCount(_addressToBytes32(_address)) > 0);
    }

    function getStreamKey(address _address)
        public
        view
        accountSettled(_address)
        returns (uint256 _streamKey)
    {
        require(
            _msgSender() == _address,
            "Stream key can only be getted by the account owner"
        );
        _streamKey = _getStreamKey(_address);
    }

    function changeStreamKey() public ownAccountSettled() {
        _setStreamKey(_msgSender());
    }

    function levelOf(address _address) public view returns (uint256 _level) {
        _level = 0;
        uint256 _auxBalance = balanceOf(_address);
        while (_auxBalance > 1) {
            _level++;
            _auxBalance /= 2;
        }
        _level += halvingNumber();
        if (_level <= 60) {
            _level = 0;
        } else if (_level > 60+32){
            _level = 32;
        }
        else {
            _level -= 60;
        }
    }

    function openLoot(address _recipient) public accountSettled(_recipient) {
        _openLoot(_msgSender(), _recipient);
    }

    function stake(uint256 _amount) public {
        _stake(_msgSender(), _amount);
    }

    function unStake(uint256 _amount) public {
        _unStake(_msgSender(), _amount);
    }

    function stakedBalanceOf(address _address) public view returns (uint256) {
        return _stakerBalances[_address];
    }

    function circulatingSupply() public view returns (uint256) {
        return totalSupply() - balanceOf(address(this));
    }

    function halvingNumber() public view returns (uint256) {
        return (block.timestamp - TOKEN_DEPLOY_BLOCK) / BLOCKS_BEFORE_HALVING;
    }

    function stakerBlockedTime(address _address) public view returns (uint256) {
        return (
            _stakerBlockedTimes[_address] < block.timestamp
                ? 0
                : _stakerBlockedTimes[_address] - block.timestamp
        );
    }

    function openLootBlockedTime(address _address)
        public
        view
        returns (uint256)
    {
        return (
            _openLootLastRewards[_address] + OPENLOOT_BLOCK_TIME <
                block.timestamp
                ? 0
                : _openLootLastRewards[_address] +
                    OPENLOOT_BLOCK_TIME -
                    block.timestamp
        );
    }

    function claimAllBSMTeamRewards() public claimTeamRewardsRole() {
        claimBsmTeamRewards(_bitstreamTokenRewards);
    }

    function claimBsmTeamRewards(uint256 _amount)
        public
        claimTeamRewardsRole()
    {
        _claimBsmTeamRewards(_msgSender(), _amount);
    }

    function getBsmTeamRewards() public view returns (uint256) {
        return _bitstreamTokenRewards;
    }

    function stakeTotalBalance() public view returns (uint256) {
        return _stakersTotalBalance;
    }

    function donate(address _recipient, uint256 _amount, string memory _message) public{
            _donate(_msgSender(), _recipient, _amount, _message);
    }

    function _donate(address _sender, address _recipient, uint256 _amount, string memory _message) internal{
        uint256 _donationDecrease = _amount/16;
                uint256 _senderIncrease =
            ((_donationDecrease / 8) * (levelOf(_sender) * 10**16)) /
                (32 * 10**16);
        uint256 _recipientIncrease =
            ((_donationDecrease / 8) * (levelOf(_recipient) * 10**16)) /
                (32 * 10**16);
        uint256 _stakersRewards = _donationDecrease/2 -_senderIncrease-_recipientIncrease;
        uint256 _burnAmount = _donationDecrease/4;
        uint256 _bitstreamTeamReward = _donationDecrease/4;
        _amount = _amount-_donationDecrease+_senderIncrease+_recipientIncrease;
        _transfer(_sender, _recipient, _amount);
        _transfer(_sender, address(this), _bitstreamTeamReward+_stakersRewards);
        _burn(_sender, _burnAmount);
        _bitstreamTokenRewards += _bitstreamTeamReward;
        _addStakersBalance(_stakersRewards);
        emit donation(_sender, _recipient, _amount+_donationDecrease-_senderIncrease-_recipientIncrease, _message);
    }

    // NOTE: Balance transfer to contract not included
    function _addStakersBalance(uint256 _amount) internal {
        _stakersTotalBalance += _amount;
        for (uint256 i = 0; i < _stakerAddresses.length(); i++) {
            uint256 _stakeAmount =
                (_amount * _stakerBalances[_stakerAddresses.at(i)]) /
                    balanceOf(address(this));
            _stakerBalances[_stakerAddresses.at(i)] += _stakeAmount;
        }
    }

    function _claimBsmTeamRewards(
        address _sender,
        uint256 _amount
    ) internal {
        require(
            balanceOf(address(this)) >= _amount,
            "Not enought tokens on Bitstream contract"
        );
        require(
            _bitstreamTokenRewards >= _amount,
            "Not enought tokens resavated for the team"
        );
        if (_amount > 0) {
            _transfer(address(this), _sender, _amount);
        }
    }

    function _openLoot(address _opener, address _recipient) internal {
        require(
            openLootBlockedTime(_opener) == 0,
            "Loot reward not avaliable yet"
        );
        require(
            _opener != _recipient,
            "You can't open loot with your own address"
        );
        require(
            halvingNumber() <= MAX_HALVING,
            "Max halving reached, OpenLoot rewards not avaliable"
        );
        uint256 _openerReward = _randomReward();
        uint256 _openerDecrease = _openerReward / 4;
        uint256 _recipientReward =
            ((_openerDecrease / 4) * (levelOf(_recipient) * 10**16)) /
                (32 * 10**16);
        uint256 _openerIncrease =
            ((_openerDecrease / 4) * (levelOf(_opener) * 10**16)) /
                (32 * 10**16);
        uint256 _bitstreamTeamReward = _openerDecrease / 2;
        uint256 _stakersReward =
            _openerDecrease -
                _recipientReward -
                _openerIncrease -
                _bitstreamTeamReward;
        _openerReward = _openerReward - _openerDecrease + _openerIncrease;
        _mint(_opener, _openerReward);
        _mint(_recipient, _recipientReward);
        _mint(address(this), _stakersReward + _bitstreamTeamReward);
        _addStakersBalance(_stakersReward);
        _bitstreamTokenRewards += _bitstreamTeamReward;
        _openLootLastRewards[_opener] = block.timestamp;
    }

    function _stake(address _sender, uint256 _amount) internal {
        require(stakerBlockedTime(_sender) == 0, "Stake balance is blocked");
        require(
            _amount >= 1 * 10**decimals(),
            "Minimum ammoount to stake is 1 BSM"
        );
        require(
            balanceOf(_sender) >= _amount,
            "Not enought balance on this account"
        );
        uint256 _burnAmount = _amount / 256;
        uint256 _bitstreamRewards = _amount / 256;
        _amount -= (_burnAmount + _bitstreamRewards);
        _burn(_sender, _burnAmount);
        _bitstreamTokenRewards += _bitstreamRewards;
        _transfer(_sender, address(this), _amount + _bitstreamRewards);
        _stakersTotalBalance += _amount;
        _stakerBalances[_sender] += _amount;
        if (!_stakerAddresses.contains(_sender)) {
            _stakerAddresses.add(_sender);
        }
        _stakerBlockedTimes[_sender] = block.timestamp + STAKE_BLOCK_TIME;
    }

    function _unStake(address _sender, uint256 _amount) internal {
        require(stakerBlockedTime(_sender) == 0, "Stake balance is blocked");
        require(
            _amount >= 1 * 10**decimals(),
            "Minimum amount to unstake is 1 BSM"
        );
        require(_stakerBalances[_sender] >= _amount, "Not enought BSM staked");
        uint256 _burnAmount = _amount / 256;
        uint256 _bitstreamRewards = _amount / 256;
        _stakerBalances[_sender] -= _amount;
        _amount -= (_burnAmount + _bitstreamRewards);
        _burn(address(this), _burnAmount);
        _transfer(address(this), _sender, _amount);
        _stakersTotalBalance -= _amount;
        _bitstreamTokenRewards += _bitstreamRewards;
        if (_stakerBalances[_sender] == 0) {
            _stakerAddresses.remove(_sender);
        }
        _stakerBlockedTimes[_sender] = block.timestamp + STAKE_BLOCK_TIME;
    }

    function _randomReward() public returns (uint256 _reward) {
        _reward = 256;
        uint256 _aux = _genRandMod();
        while (_aux > 1) {
            _reward--;
            _aux /= 2;
        }
        _reward = _reward * REWARD_UMBRAL / 2**halvingNumber();
    }

    function _getStreamKey(address _address)
        internal
        view
        returns (uint256 _streamKey)
    {
        _streamKey = _streamKeys[_address];
    }

    // TODO: Acabar
    function _createPrediction(
        address _address,
        string memory _question,
        string[] memory _answers
    ) public {}

    function _setupAccount(address _address) internal {
        require(!isAccountSettled(_address), "Account already settled");
        _setupRole(_addressToBytes32(_address), _address);
        _setStreamKey(_address);
    }

    function _setStreamKey(address _address) internal {
        uint256 _streamKey = _validStreamKey();
        _enumerableStreamKeys.add(_streamKey);
        _streamKeys[_address] = _streamKey;
    }

    function _validStreamKey() internal returns (uint256 _streamKey) {
        do {
            _streamKey = _genRandMod();
        } while (_enumerableStreamKeys.contains(_streamKey));
    }

    function _genRandMod() internal returns (uint256) {
        _randNonce++;
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, msg.sender, _randNonce)
                )
            );
    }

    function _stringToBytes32(string memory _string)
        internal
        pure
        returns (bytes32 _result)
    {
        bytes memory tempEmptyStringTest = bytes(_string);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            _result := mload(add(_string, 32))
        }
    }

    function _addressToBytes(address _address)
        internal
        pure
        returns (bytes memory _bytes)
    {
        _bytes = bytes(new bytes(32));
        for (uint256 i = 0; i < 32; i++)
            _bytes[i] = bytes1(
                uint8(uint256(uint160(address(_address))) / (2**(8 * (31 - i))))
            );
    }

    function _bytesToBytes32(bytes memory _bytes, uint256 _offset)
        internal
        pure
        returns (bytes32 _bytes32)
    {
        for (uint256 i = 0; i < 32; i++) {
            _bytes32 |= bytes32(_bytes[_offset + i] & 0xFF) >> (i * 8);
        }
        return _bytes32;
    }

    function _addressToBytes32(address _address)
        public
        pure
        returns (bytes32 _bytes32)
    {
        _bytes32 = _bytesToBytes32(_addressToBytes(_address), 0);
    }
}
