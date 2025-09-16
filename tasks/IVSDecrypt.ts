import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";

// Contract address (update after deployment)
const IVS_CONTRACT_ADDRESS = "0x6A4ADcf7fb926e4Ae9Bf8aCc943Ac0F204648d53";

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
        const requestId = parsed?.args[0];
        console.log(`Request ID: ${requestId}`);
        console.log(`User ID: ${parsed?.args[1]}`);
        console.log(`\n✅ Decryption request submitted successfully!`);
        console.log(`⏳ Waiting for Zama relayer to process (up to 150 seconds)...`);
        
        // Wait for decryption result and auto-convert
        console.log(`📡 Monitoring events for DecryptionCompleted...`);
        
        const filter = contract.filters.DecryptionCompleted();
        const timeout = setTimeout(() => {
          console.log(`⚠️  Timeout after 150 seconds. Check events manually with: npx hardhat task:ivs-check-events --network sepolia`);
        }, 150000);

        contract.once(filter, (eventRequestId: any, eventUserId: any, rawValue: any, dataType: any, scaledValue: any) => {
          if (eventRequestId.toString() === requestId.toString()) {
            clearTimeout(timeout);
            const decimalValue = (Number(rawValue) / 10000).toFixed(3);
            
            console.log(`\n🎉 IVS Decryption Complete!`);
            console.log(`═══════════════════════════════════════`);
            console.log(`👤 User ID: ${eventUserId.toString()}`);
            console.log(`🔢 Raw IVS Value: ${rawValue.toString()}`);
            console.log(`💯 Decimal IVS Score: ${decimalValue}`);
            console.log(`🆔 Request ID: ${eventRequestId.toString()}`);
            console.log(`═══════════════════════════════════════`);
            
            // Interpretation
            const decimalNum = parseFloat(decimalValue);
            if (decimalNum >= 0.5) {
              console.log(`📈 Risk Level: HIGH (Direct infection or high exposure)`);
            } else if (decimalNum >= 0.25) {
              console.log(`📊 Risk Level: MEDIUM (Direct contact with infected)`);
            } else if (decimalNum >= 0.125) {
              console.log(`📉 Risk Level: LOW (Second-level contact)`);
            } else {
              console.log(`✅ Risk Level: MINIMAL (Low or no exposure)`);
            }
            
            process.exit(0);
          }
        });
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
        const requestId = parsed?.args[0];
        console.log(`Request ID: ${requestId}`);
        console.log(`User ID: ${parsed?.args[1]}`);
        console.log(`\n✅ Health status decryption request submitted successfully!`);
        console.log(`⏳ Waiting for Zama relayer to process (up to 150 seconds)...`);
        
        // Wait for decryption result and auto-convert
        console.log(`📡 Monitoring events for DecryptionCompleted...`);
        
        const filter = contract.filters.DecryptionCompleted();
        const timeout = setTimeout(() => {
          console.log(`⚠️  Timeout after 150 seconds. Check events manually with: npx hardhat task:ivs-check-events --network sepolia`);
        }, 150000);
        
        contract.once(filter, (eventRequestId: any, eventUserId: any, rawValue: any, dataType: any, scaledValue: any) => {
          if (eventRequestId.toString() === requestId.toString()) {
            clearTimeout(timeout);
            
            console.log(`\n🎉 Health Status Decryption Complete!`);
            console.log(`════════════════════════════════════════`);
            console.log(`👤 User ID: ${eventUserId.toString()}`);
            
            if (dataType === "health") {
              const healthStatus = rawValue.toString() === "1" ? "INFECTED" : "NOT INFECTED";
              console.log(`🏥 Health Status: ${healthStatus}`);
            } else {
              const decimalValue = (Number(rawValue) / 10000).toFixed(3);
              console.log(`🔢 Raw Value: ${rawValue.toString()}`);
              console.log(`💯 Decimal Value: ${decimalValue}`);
            }
            
            console.log(`🆔 Request ID: ${eventRequestId.toString()}`);
            console.log(`════════════════════════════════════════`);
            
            process.exit(0);
          }
        });
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
        console.log(`\n🎉 Decryption Completed!`);
        console.log(`═══════════════════════════════════════`);
        console.log(`🆔 Request ID: ${requestId.toString()}`);
        console.log(`👤 User ID: ${userId.toString()}`);
        console.log(`📋 Data Type: ${dataType}`);
        console.log(`🔢 Raw Decrypted Value: ${decryptedValue.toString()}`);
        
        if (dataType === "ivs") {
          // For IVS, show the meaningful interpretation
          const decimalValue = (Number(decryptedValue) / 10000).toFixed(3);
          console.log(`💯 IVS Score (decimal): ${decimalValue}`);
          
          // Risk level interpretation
          const decimalNum = parseFloat(decimalValue);
          if (decimalNum >= 0.5) {
            console.log(`📈 Risk Level: HIGH (Direct infection or high exposure)`);
          } else if (decimalNum >= 0.25) {
            console.log(`📊 Risk Level: MEDIUM (Direct contact with infected)`);
          } else if (decimalNum >= 0.125) {
            console.log(`📉 Risk Level: LOW (Second-level contact)`);
          } else {
            console.log(`✅ Risk Level: MINIMAL (Low or no exposure)`);
          }
        } else if (dataType === "health") {
          // For health status, 0 = healthy, 1 = infected
          const healthStatus = decryptedValue.toString() === "1" ? "INFECTED" : "NOT INFECTED";
          console.log(`🏥 Health Status: ${healthStatus}`);
        }
      } else {
        // Old format: requestId, userId, decryptedValue
        const [requestId, userId, decryptedValue] = args;
        console.log(`\n✅ Decryption Completed!`);
        console.log(`Request ID: ${requestId.toString()}`);
        console.log(`User ID: ${userId.toString()}`);
        console.log(`Decrypted Value: ${decryptedValue.toString()}`);
      }
      
        console.log(`═══════════════════════════════════════`);
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

/**
 * Request IVS decryption and wait for result with decimal conversion (admin only)
 */
task("task:ivs-decrypt-complete", "Request IVS decryption and wait for decimal result")
  .addParam("userid", "The user ID to decrypt IVS score for")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const userId = parseInt(taskArguments.userid);
    if (!Number.isInteger(userId)) {
      throw new Error(`Argument --userid is not an integer`);
    }

    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`🔐 Requesting IVS decryption for user ${userId}...`);
    console.log(`Contract: ${IVS_CONTRACT_ADDRESS}`);

    try {
      // Set up event filter
      const filter = contract.filters.DecryptionCompleted();
      
      const decryptionPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Decryption timeout after 150 seconds'));
        }, 150000);

        const eventHandler = (requestId: any, userIdEvent: any, rawValue: any, dataType: any, scaledValue: any) => {
          if (userIdEvent.toString() === userId.toString() && dataType === 'ivs') {
            clearTimeout(timeout);
            const decryptionResult = {
              requestId: requestId.toString(),
              userId: userIdEvent.toString(),
              rawValue: rawValue.toString(),
              scaledValue: scaledValue.toString(),
              decimalValue: (Number(rawValue) / 10000).toFixed(3)
            };
            contract.off(filter, eventHandler);
            resolve(decryptionResult);
          }
        };

        contract.on(filter, eventHandler);
      });

      // Request decryption (admin only)
      const tx = await contract.getDecryptedIVS(userId);
      const receipt = await tx.wait();
      
      console.log(`✅ Transaction confirmed: ${tx.hash}`);
      console.log(`⏳ Waiting for decryption by Zama relayer...`);
      
      // Wait for decryption to complete
      const result = await decryptionPromise as any;
      
      console.log(`\n🎉 IVS Decryption Complete!`);
      console.log(`═══════════════════════════════════════`);
      console.log(`👤 User ID: ${result.userId}`);
      console.log(`🔢 Raw IVS Value: ${result.rawValue}`);
      console.log(`📊 Scaled Value: ${result.scaledValue}`);
      console.log(`💯 Decimal IVS Score: ${result.decimalValue}`);
      console.log(`🆔 Request ID: ${result.requestId}`);
      console.log(`═══════════════════════════════════════`);
      
      // Interpretation
      const decimalNum = parseFloat(result.decimalValue);
      if (decimalNum >= 0.5) {
        console.log(`📈 Risk Level: HIGH (Direct infection or high exposure)`);
      } else if (decimalNum >= 0.25) {
        console.log(`📊 Risk Level: MEDIUM (Direct contact with infected)`);
      } else if (decimalNum >= 0.125) {
        console.log(`📉 Risk Level: LOW (Second-level contact)`);
      } else {
        console.log(`✅ Risk Level: MINIMAL (Low or no exposure)`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Decryption failed: ${errorMessage}`);
    }
  });

/**
 * Helper task to convert raw IVS values to decimal
 */
task("task:ivs-convert", "Convert raw IVS value to decimal")
  .addParam("rawvalue", "The raw IVS value to convert")
  .setAction(async function (taskArguments: TaskArguments) {
    const rawValue = parseInt(taskArguments.rawvalue);
    if (!Number.isInteger(rawValue)) {
      throw new Error(`Argument --rawvalue is not an integer`);
    }

    const decimalValue = (rawValue / 10000).toFixed(3);
    
    console.log(`\n🔢 IVS Value Conversion`);
    console.log(`═══════════════════════════════════════`);
    console.log(`📊 Raw Value: ${rawValue}`);
    console.log(`💯 Decimal Value: ${decimalValue}`);
    console.log(`═══════════════════════════════════════`);
    
    // Interpretation
    const decimalNum = parseFloat(decimalValue);
    if (decimalNum >= 0.5) {
      console.log(`📈 Risk Level: HIGH (Direct infection or high exposure)`);
    } else if (decimalNum >= 0.25) {
      console.log(`📊 Risk Level: MEDIUM (Direct contact with infected)`);
    } else if (decimalNum >= 0.125) {
      console.log(`📉 Risk Level: LOW (Second-level contact)`);
    } else {
      console.log(`✅ Risk Level: MINIMAL (Low or no exposure)`);
    }
  });