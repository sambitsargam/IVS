import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying InfectionVulnerabilityScore contract...");
  console.log("Deploying with account:", deployer);

  const deployedIVS = await deploy("InfectionVulnerabilityScore", {
    from: deployer,
    log: true,
  });

  console.log(`InfectionVulnerabilityScore contract deployed to: `, deployedIVS.address);
  
  // Get the deployed contract to verify
  const contract = await hre.ethers.getContractAt("InfectionVulnerabilityScore", deployedIVS.address);
  console.log("Admin address set to:", await contract.admin());
  console.log("Total users:", await contract.getTotalUsers());
};

export default func;
func.id = "deploy_infectionVulnerabilityScore"; // id required to prevent reexecution
func.tags = ["InfectionVulnerabilityScore"];