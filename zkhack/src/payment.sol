// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Verifier {
      function verify(uint256[37] calldata instances, bytes calldata proof) external view returns(bool);
}

contract PaymentContract {
    address public depositor;
    address public payee;
    uint public amount;
    bool public condition;

    constructor() {
        depositor = msg.sender;
    }

    // deposit
    function deposit() external payable {
        require(msg.sender == depositor, "You are not the depositor.");
        require(msg.value > 0, "Deposit amount should be greater than 0.");
        amount += msg.value;
    }

    // // condition ，
    // function setCondition(bool _condition) external {
    //     require(msg.sender == depositor, "You are not allowed to set conditions.");
    //     condition = _condition;
    // }

    // get verification result
    function verificationResult(address verificationContract, uint256[37] calldata instances, bytes calldata proof ) public{
        require(msg.sender == depositor, "Only depositor are allow to verify");
        Verifier verifier = Verifier(verificationContract);

        condition = verifier.verify(instances, proof);

    }

    // withdraw if they don't pass the verification
    function withdraw() external {
        require(msg.sender == depositor, "You are not the depositor.");
        require(!condition, "They passed the test.");
        uint balance = amount;
        amount = 0;
        payable(msg.sender).transfer(balance);
    }

    // pay to the company if they pass
    function pay() external {
        require(msg.sender == depositor, "You are not allowed to make payments.");
        require(condition, "Condition is not fulfilled.");
        require(amount > 0, "No funds available.");
        uint amountToSend = amount;
        amount = 0;
        payable(payee).transfer(amountToSend);
    }

    // set payee
    function setPayee(address _payee) external {
        require(msg.sender == depositor, "You are not allowed to set the payee.");
        payee = _payee;
    }
}