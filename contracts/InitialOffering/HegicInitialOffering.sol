pragma solidity 0.6.12;

/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Hegic
 * Copyright (C) 2020 Hegic Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @author 0mllwntrmt3
 * @title Hegic Initial Offering
 * @notice some description
 */
contract HegicInitialOffering is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    event Claimed(address indexed account, uint userShare, uint hegicAmount);
    event Received(address indexed account, uint amount);

    uint public constant START = 1599678000;
    uint public constant END = START + 3 days;
    uint public constant TOTAL_DISTRIBUTE_AMOUNT = 90_360_300e18;
    uint public constant MINIMAL_PROVIDE_AMOUNT = 700 ether;
    uint public totalProvided = 0;
    mapping(address => uint) public provided;
    IERC20 public immutable HEGIC;

    constructor(IERC20 hegic) public {
        HEGIC = hegic;
    }

    receive() external payable {
        require(START <= block.timestamp, "The offering has not started yet");
        require(block.timestamp <= END, "The offering has already ended");
        totalProvided += msg.value;
        provided[msg.sender] += msg.value;
        emit Received(msg.sender, msg.value);
    }

    function claim() external {
        require(block.timestamp > END);
        require(provided[msg.sender] > 0);

        uint userShare = provided[msg.sender];
        provided[msg.sender] = 0;

        if(totalProvided >= MINIMAL_PROVIDE_AMOUNT) {
            uint hegicAmount = TOTAL_DISTRIBUTE_AMOUNT
                .mul(userShare)
                .div(totalProvided);
            HEGIC.safeTransfer(msg.sender, hegicAmount);
            emit Claimed(msg.sender, userShare, hegicAmount);
        } else {
            msg.sender.transfer(userShare);
            emit Claimed(msg.sender, userShare, 0);
        }
    }

    function withdrawProvidedETH() external onlyOwner {
        require(END < block.timestamp, "The offering must be completed");
        require(
            totalProvided >= MINIMAL_PROVIDE_AMOUNT,
            "The required amount has not been provided!"
        );
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawHEGIC() external onlyOwner {
        require(END < block.timestamp, "The offering must be completed");
        require(
            totalProvided < MINIMAL_PROVIDE_AMOUNT,
            "The required amount has been provided!"
        );
        HEGIC.safeTransfer(owner(), HEGIC.balanceOf(address(this)));
    }

    function withdrawUnclaimedHEGIC() external onlyOwner {
        require(END + 30 days < block.timestamp, "Withdrawal unavailable yet");
        HEGIC.safeTransfer(owner(), HEGIC.balanceOf(address(this)));
    }
}
