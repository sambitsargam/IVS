import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";

// Contract address (update after deployment)
const IVS_CONTRACT_ADDRESS = "0x125c8834a1728f4170e1DD7073806e376EeC1030";

/**
 * Request decryption of IVS score using     } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to decrypt users: ${errorMessage}`);
    }tract callback (admin only)
 */
task("task:ivs-decrypt-v2", "Request IVS score decryption using contract callback")
  .addParam("userid", "The user ID to decrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const userId = parseInt(taskArguments.userid);
    if (!Number.isInteger(userId)) {
      throw new Error(`Argument --userid is not an integer`);
    }

    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Requesting decryption for user ${userId}...`);

    try {
      // Request decryption (admin only)
      const tx = await contract.getDecryptedIVS(userId);
      const receipt = await tx.wait();
      
      console.log(`Decryption requested! Transaction: ${tx.hash}`);
      
      // Look for DecryptionRequested event
      const requestEvent = receipt?.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'DecryptionRequested';
        } catch {
          return false;
        }
      });
      
      if (requestEvent) {
        const parsed = contract.interface.parseLog(requestEvent);
        console.log(`Request ID: ${parsed?.args[0]}`);
        console.log(`User ID: ${parsed?.args[1]}`);
        console.log(`\nDecryption request submitted successfully!`);
        console.log(`Monitor the contract events for DecryptionCompleted to see the result.`);
        console.log(`(This will be handled by the relayer and may take a few moments)`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Decryption request failed: ${errorMessage}`);
    }
  });

/**
 * Request decryption of health status using contract callback (admin only)
 */
task("task:ivs-decrypt-health", "Request health status decryption using contract callback")
  .addParam("userid", "The user ID to decrypt health status for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const userId = parseInt(taskArguments.userid);
    if (!Number.isInteger(userId)) {
      throw new Error(`Argument --userid is not an integer`);
    }

    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Requesting health status decryption for user ${userId}...`);

    try {
      // Request decryption (admin only)
      const tx = await contract.getDecryptedHealthStatus(userId);
      const receipt = await tx.wait();
      
      console.log(`Health status decryption requested! Transaction: ${tx.hash}`);
      
      // Look for DecryptionRequested event
      const requestEvent = receipt?.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'DecryptionRequested';
        } catch {
          return false;
        }
      });
      
      if (requestEvent) {
        const parsed = contract.interface.parseLog(requestEvent);
        console.log(`Request ID: ${parsed?.args[0]}`);
        console.log(`User ID: ${parsed?.args[1]}`);
        console.log(`\nHealth status decryption request submitted successfully!`);
        console.log(`Monitor the contract events for DecryptionCompleted to see the result.`);
        console.log(`(This will be handled by the relayer and may take a few moments)`);
      } else {
        console.log(`No DecryptionRequested event found in transaction receipt`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to request health status decryption: ${errorMessage}`);
    }
  });

/**
 * Listen for DecryptionCompleted events
 */
task("task:ivs-listen-decrypt", "Listen for IVS decryption completion events")
  .setAction(async function (_taskArguments: TaskArguments, hre) {
    const { ethers } = hre;

    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Listening for DecryptionCompleted events...`);
    console.log(`Contract: ${IVS_CONTRACT_ADDRESS}`);
    console.log(`Press Ctrl+C to stop listening`);
    console.log(`==========================================`);

    // Set up event filter for DecryptionCompleted events
    const filter = contract.filters.DecryptionCompleted();
    
    // Listen for events with flexible parameter handling
    void contract.on(filter, (...args: any[]) => {
      // Handle both old and new event formats
      if (args.length >= 5) {
        // New format: requestId, userId, decryptedValue, dataType, scaledValue
        const [requestId, userId, decryptedValue, dataType, scaledValue] = args;
        console.log(`\n✅ Decryption Completed!`);
        console.log(`Request ID: ${requestId.toString()}`);
        console.log(`User ID: ${userId.toString()}`);
        console.log(`Data Type: ${dataType}`);
        console.log(`Raw Decrypted Value: ${decryptedValue.toString()}`);
        console.log(`Scaled Value: ${scaledValue.toString()}`);
        
        if (dataType === "ivs") {
          // For IVS, show the meaningful interpretation
          const decimalValue = Number(scaledValue) / 1000; // Convert back to decimal (0.500, 0.250, etc.)
          console.log(`IVS Score (decimal): ${decimalValue.toFixed(3)}`);
        } else if (dataType === "health") {
          // For health status, 0 = healthy, 1 = infected
          console.log(`Health Status: ${decryptedValue.toString() === "1" ? "Infected" : "Healthy"}`);
        }
      } else {
        // Old format: requestId, userId, decryptedValue
        const [requestId, userId, decryptedValue] = args;
        console.log(`\n✅ Decryption Completed!`);
        console.log(`Request ID: ${requestId.toString()}`);
        console.log(`User ID: ${userId.toString()}`);
        console.log(`Decrypted Value: ${decryptedValue.toString()}`);
      }
      
      console.log(`==========================================`);
    });

    // Keep the process alive
    process.stdin.resume();
  });

/**
 * Decrypt IVS scores using fhEVM SDK
 */
task("task:ivs-decrypt-sdk", "Decrypt IVS scores using fhEVM SDK")
  .addParam("userid", "The user ID to decrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;
    
    const userId = parseInt(taskArguments.userid);
    if (!Number.isInteger(userId)) {
      throw new Error(`Argument --userid is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Attempting to decrypt IVS score for user ${userId}...`);

    try {
      // Get encrypted IVS score
      const encryptedIVS = await contract.getEncryptedIVS(userId);
      console.log(`Encrypted IVS: ${encryptedIVS}`);

      // Get encrypted health status
      const encryptedHealth = await contract.getEncryptedHealthStatus(userId);
      console.log(`Encrypted Health: ${encryptedHealth}`);

      // Try to decrypt using fhEVM SDK
      if (encryptedIVS !== ethers.ZeroHash) {
        try {
          const decryptedIVS = await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedIVS,
            IVS_CONTRACT_ADDRESS,
            signers[0]
          );
          console.log(`Decrypted IVS Score: ${decryptedIVS}`);
        } catch (decryptError: unknown) {
          const errorMessage = decryptError instanceof Error ? decryptError.message : 'Unknown error';
          console.log(`IVS Decryption failed: ${errorMessage}`);
        }
      }

      if (encryptedHealth !== ethers.ZeroHash) {
        try {
          const decryptedHealth = await fhevm.userDecryptEuint(
            FhevmType.euint8,
            encryptedHealth,
            IVS_CONTRACT_ADDRESS,
            signers[0]
          );
          console.log(`Decrypted Health Status: ${decryptedHealth}`);
        } catch (decryptError: unknown) {
          const errorMessage = decryptError instanceof Error ? decryptError.message : 'Unknown error';
          console.log(`Health Decryption failed: ${errorMessage}`);
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Operation failed: ${errorMessage}`);
    }
  });

/**
 * Decrypt all users' scores
 */
task("task:ivs-decrypt-all", "Decrypt IVS scores for all users")
  .setAction(async function (_taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Decrypting IVS scores for all users...`);
    console.log(`===========================================`);

    try {
      const allUsers = await contract.getAllUsers();
      console.log(`Total users: ${allUsers.length}`);
      console.log(`Users: [${allUsers.join(', ')}]`);
      console.log();

      interface DecryptionResult {
        userId: string;
        healthStatus?: string;
        ivsScore?: string;
        health?: string;
        ivs?: string;
      }

      const results: DecryptionResult[] = [];

      for (let i = 0; i < allUsers.length; i++) {
        const userId = allUsers[i];
        console.log(`User ${userId}:`);
        
        try {
          // Get encrypted values
          const encryptedIVS = await contract.getEncryptedIVS(userId);
          const encryptedHealth = await contract.getEncryptedHealthStatus(userId);
          
          let decryptedIVS = "N/A";
          let decryptedHealth = "N/A";

          // Try to decrypt IVS
          if (encryptedIVS !== ethers.ZeroHash) {
            try {
              const ivs = await fhevm.userDecryptEuint(
                FhevmType.euint32,
                encryptedIVS,
                IVS_CONTRACT_ADDRESS,
                signers[0]
              );
              decryptedIVS = ivs.toString();
            } catch {
              decryptedIVS = "Decrypt Failed";
            }
          }

          // Try to decrypt health
          if (encryptedHealth !== ethers.ZeroHash) {
            try {
              const health = await fhevm.userDecryptEuint(
                FhevmType.euint8,
                encryptedHealth,
                IVS_CONTRACT_ADDRESS,
                signers[0]
              );
              decryptedHealth = health.toString();
            } catch {
              decryptedHealth = "Decrypt Failed";
            }
          }

          console.log(`  Health Status: ${decryptedHealth} (${decryptedHealth === "1" ? "Infected" : decryptedHealth === "0" ? "Healthy" : "Unknown"})`);
          console.log(`  IVS Score: ${decryptedIVS}`);
          
          results.push({
            userId: userId.toString(),
            health: decryptedHealth,
            ivs: decryptedIVS
          });

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`  Error: ${errorMessage}`);
          results.push({
            userId: userId.toString(),
            health: "Error",
            ivs: "Error"
          });
        }
        console.log();
      }

      // Summary table
      console.log(`Summary:`);
      console.log(`========`);
      console.log(`User | Health | IVS Score`);
      console.log(`-----|--------|----------`);
      results.forEach(r => {
        console.log(`  ${r.userId}  |   ${r.health}    |   ${r.ivs}`);
      });

      // Expected vs Actual comparison
      console.log();
      console.log(`Expected IVS (from contract comments):`);
      console.log(`=====================================`);
      console.log(`User 1: ~5000 (0.5 * 10000 scale)`);
      console.log(`User 2: ~2500 (0.25 * 10000 scale)`);
      console.log(`User 3: ~2500 (0.25 * 10000 scale)`);
      console.log(`User 4: ~1250 (0.125 * 10000 scale)`);
      console.log(`User 5: ~1250 (0.125 * 10000 scale)`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to decrypt all scores: ${errorMessage}`);
    }
  });