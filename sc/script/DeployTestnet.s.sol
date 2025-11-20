// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {MinimalForwarder} from "../src/MinimalForwarder.sol";
import {DAOVoting} from "../src/DAOVoting.sol";

contract DeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory rpcUrl = vm.envString("RPC_URL");
        
        // Set up the RPC URL
        vm.createSelectFork(rpcUrl);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MinimalForwarder
        console.log("Deploying MinimalForwarder...");
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));
        
        // Deploy DAOVoting with forwarder address
        console.log("Deploying DAOVoting...");
        DAOVoting dao = new DAOVoting(address(forwarder));
        console.log("DAOVoting deployed at:", address(dao));
        
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("MinimalForwarder:", address(forwarder));
        console.log("DAOVoting:", address(dao));
        console.log("Network: Testnet");
        console.log("RPC URL:", rpcUrl);
    }
}

