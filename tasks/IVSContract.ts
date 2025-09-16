import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * IVS Contract On-Chain Testing Tasks
 * ==================================
 * 
 * Contract Address: 0x4A57f36051ab7Cb0C556c51c9573F4EE2E6c6680
 * Network: Sepolia
 * 
 * Usage Examples:
 *   npx hardhat --network sepolia task:ivs-register --userid 1
 *   npx hardhat --network sep    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Registration failed: ${errorMessage}`);
    }a task:ivs-add-contact --usera 1 --userb 2
 *   npx hardhat --network sepolia task:ivs-set-health --userid 1 --status 1
 *   npx hardhat --network sepolia task:ivs-compute --dmax 2
 *   npx hardhat --network sepolia task:ivs-get-score --userid 1
 */

// Contract address (update after deployment)
const IVS_CONTRACT_ADDRESS = "0xf92D670b1d0f929524Cf51d510781d88F1920733";

/**
 * Register a new user in the IVS system
 */
task("task:ivs-register", "Register a user in the IVS system")
  .addParam("userid", "The user ID to register")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const userId = parseInt(taskArguments.userid);
    if (!Number.isInteger(userId)) {
      throw new Error(`Argument --userid is not an integer`);
    }

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Registering user ${userId}...`);
    console.log(`Contract: ${IVS_CONTRACT_ADDRESS}`);
    console.log(`Signer: ${signers[0].address}`);

    try {
      const tx = await contract.connect(signers[0]).registerUser(userId);
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
      console.log(`Gas used: ${receipt?.gasUsed}`);
      
      const totalUsers = await contract.getTotalUsers();
      console.log(`Total users now: ${totalUsers}`);
      
      const isRegistered = await contract.isUserRegistered(userId);
      console.log(`User ${userId} registered: ${isRegistered}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Registration failed: ${errorMessage}`);
      if (errorMessage.includes("UserAlreadyRegistered")) {
        console.log(`User ${userId} is already registered`);
      }
    }
  });

/**
 * Add a contact relationship between two users
 */
task("task:ivs-add-contact", "Add contact between two users")
  .addParam("usera", "First user ID")
  .addParam("userb", "Second user ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const userA = parseInt(taskArguments.usera);
    const userB = parseInt(taskArguments.userb);
    
    if (!Number.isInteger(userA) || !Number.isInteger(userB)) {
      throw new Error(`User IDs must be integers`);
    }

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Adding contact between user ${userA} and user ${userB}...`);

    try {
      const tx = await contract.connect(signers[0]).addContact(userA, userB);
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
      
      const contactsA = await contract.getUserContacts(userA);
      const contactsB = await contract.getUserContacts(userB);
      
      console.log(`User ${userA} contacts: [${contactsA.join(', ')}]`);
      console.log(`User ${userB} contacts: [${contactsB.join(', ')}]`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Adding contact failed: ${errorMessage}`);
    }
  });

/**
 * Set encrypted health status for a user
 */
task("task:ivs-set-health", "Set health status for a user")
  .addParam("userid", "The user ID")
  .addParam("status", "Health status (0=healthy, 1=infected)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;
    
    const userId = parseInt(taskArguments.userid);
    const status = parseInt(taskArguments.status);
    
    if (!Number.isInteger(userId) || !Number.isInteger(status)) {
      throw new Error(`Arguments must be integers`);
    }
    
    if (status !== 0 && status !== 1) {
      throw new Error(`Status must be 0 (healthy) or 1 (infected)`);
    }

    await fhevm.initializeCLIApi();

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Setting health status for user ${userId} to ${status}...`);

    try {
      // Encrypt the health status
      const encryptedStatus = await fhevm
        .createEncryptedInput(IVS_CONTRACT_ADDRESS, signers[0].address)
        .add8(status)
        .encrypt();

      const tx = await contract
        .connect(signers[0])
        .setHealthStatus(userId, encryptedStatus.handles[0], encryptedStatus.inputProof);
      
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
      console.log(`Health status set successfully for user ${userId}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Setting health status failed: ${errorMessage}`);
    }
  });

/**
 * Compute IVS scores for all users (admin only)
 */
task("task:ivs-compute", "Compute IVS scores for all users")
  .addParam("dmax", "Maximum depth for propagation")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const dMax = parseInt(taskArguments.dmax);
    if (!Number.isInteger(dMax)) {
      throw new Error(`Argument --dmax is not an integer`);
    }

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Computing IVS scores with dMax=${dMax}...`);
    console.log(`Admin: ${signers[0].address}`);

    try {
      const tx = await contract.connect(signers[0]).computeIVS(dMax);
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
      console.log(`Gas used: ${receipt?.gasUsed}`);
      console.log(`IVS computation completed successfully`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`IVS computation failed: ${errorMessage}`);
      if (errorMessage.includes("OnlyAdmin")) {
        console.log(`Only the admin can compute IVS scores`);
      }
    }
  });

/**
 * Get encrypted IVS score for a user
 */
task("task:ivs-get-score", "Get encrypted IVS score for a user")
  .addParam("userid", "The user ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const userId = parseInt(taskArguments.userid);
    if (!Number.isInteger(userId)) {
      throw new Error(`Argument --userid is not an integer`);
    }

    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Getting encrypted IVS score for user ${userId}...`);

    try {
      const encryptedScore = await contract.getEncryptedIVS(userId);
      console.log(`Encrypted IVS score: ${encryptedScore}`);
      
      const encryptedHealth = await contract.getEncryptedHealthStatus(userId);
      console.log(`Encrypted health status: ${encryptedHealth}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Getting IVS score failed: ${errorMessage}`);
    }
  });

/**
 * Get contract information and stats
 */
/**
 * Check recent contract events
 */
task("task:ivs-check-events", "Check recent contract events")
  .setAction(async function (_taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);
    
    console.log("Checking recent events on contract:", IVS_CONTRACT_ADDRESS);
    
    // Get current block
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    // Check for DecryptionRequested events (last 100 blocks)
    const fromBlock = currentBlock - 100;
    
    try {
      console.log(`\nChecking DecryptionRequested events from block ${fromBlock} to ${currentBlock}...`);
      const requestedFilter = contract.filters.DecryptionRequested();
      const requestedEvents = await contract.queryFilter(requestedFilter, fromBlock, currentBlock);
      
      console.log(`Found ${requestedEvents.length} DecryptionRequested events:`);
      for (const event of requestedEvents) {
        const args = event.args;
        console.log(`  Block ${event.blockNumber}: RequestID=${args[0]}, UserID=${args[1]}`);
      }
      
      console.log(`\nChecking DecryptionCompleted events from block ${fromBlock} to ${currentBlock}...`);
      const completedFilter = contract.filters.DecryptionCompleted();
      const completedEvents = await contract.queryFilter(completedFilter, fromBlock, currentBlock);
      
      console.log(`Found ${completedEvents.length} DecryptionCompleted events:`);
      for (const event of completedEvents) {
        const args = event.args;
        console.log(`  Block ${event.blockNumber}: RequestID=${args[0]}, UserID=${args[1]}, DecryptedValue=${args[2]}`);
      }
      
      if (requestedEvents.length > 0 && completedEvents.length === 0) {
        console.log(`\n⚠️  Found ${requestedEvents.length} decryption requests but no completed events.`);
        console.log("This suggests the fhEVM relayer is either:");
        console.log("1. Still processing the request (can take 1-5 minutes)");
        console.log("2. Encountering an issue with the callback function");
        console.log("3. Network congestion or relayer downtime");
        console.log("\nYou can:");
        console.log("- Wait a few more minutes and check again");
        console.log("- Try the SDK-based decryption as an alternative");
        console.log("- Check fhEVM network status");
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error checking events:", errorMessage);
    }
  });

/**
 * Request decryption of IVS score (admin only)
 */
task("task:ivs-decrypt", "Request decryption of IVS score (admin only)")
  .addParam("userid", "The user ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers } = hre;
    
    const userId = parseInt(taskArguments.userid);
    if (!Number.isInteger(userId)) {
      throw new Error(`Argument --userid is not an integer`);
    }

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Requesting decryption of IVS score for user ${userId}...`);

    try {
      const tx = await contract.connect(signers[0]).getDecryptedIVS(userId);
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
      console.log(`Decryption request submitted successfully`);
      console.log(`Note: Check contract events for DecryptionRequested event with requestId`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Decryption request failed: ${errorMessage}`);
    }
  });

/**
 * Setup test scenario with 5 users
 */
task("task:ivs-setup-test", "Setup test scenario with 5 users and contacts")
  .setAction(async function (_taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("InfectionVulnerabilityScore", IVS_CONTRACT_ADDRESS);

    console.log(`Setting up test scenario with 5 users...`);
    console.log(`This will create the example from the contract comments`);

    try {
      // Register 5 users
      console.log(`\n1. Registering users 1-5...`);
      for (let i = 1; i <= 5; i++) {
        try {
          const tx = await contract.connect(signers[0]).registerUser(i);
          await tx.wait();
          console.log(`  ✓ User ${i} registered`);
        } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (errorMessage.includes("UserAlreadyRegistered")) {
            console.log(`  - User ${i} already registered`);
          } else {
            console.log(`  ✗ User ${i} failed: ${errorMessage}`);
          }
        }
      }

      // Add contacts as per example
      console.log(`\n2. Adding contacts...`);
      const contacts = [
        [1, 2], [1, 3], [2, 4], [3, 5]
      ];
      
      for (const [userA, userB] of contacts) {
        try {
          const tx = await contract.connect(signers[0]).addContact(userA, userB);
          await tx.wait();
          console.log(`  ✓ Contact added: ${userA} ↔ ${userB}`);
        } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`  ✗ Contact ${userA}-${userB} failed: ${errorMessage}`);
        }
      }

      // Set health status (user 1 infected, others healthy)
      console.log(`\n3. Setting health status...`);
      
      // User 1: infected (1)
      try {
        const encryptedStatus = await fhevm
          .createEncryptedInput(IVS_CONTRACT_ADDRESS, signers[0].address)
          .add8(1)
          .encrypt();
        
        const tx = await contract
          .connect(signers[0])
          .setHealthStatus(1, encryptedStatus.handles[0], encryptedStatus.inputProof);
        await tx.wait();
        console.log(`  ✓ User 1: infected (1)`);
      } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ✗ User 1 health status failed: ${errorMessage}`);
      }

      // Users 2-5: healthy (0)
      for (let i = 2; i <= 5; i++) {
        try {
          const encryptedStatus = await fhevm
            .createEncryptedInput(IVS_CONTRACT_ADDRESS, signers[0].address)
            .add8(0)
            .encrypt();
          
          const tx = await contract
            .connect(signers[0])
            .setHealthStatus(i, encryptedStatus.handles[0], encryptedStatus.inputProof);
          await tx.wait();
          console.log(`  ✓ User ${i}: healthy (0)`);
        } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`  ✗ User ${i} health status failed: ${errorMessage}`);
        }
      }

      console.log(`\n4. Test setup complete!`);
      console.log(`Now run: npx hardhat --network sepolia task:ivs-compute --dmax 2`);
      console.log(`Then: npx hardhat --network sepolia task:ivs-info`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Test setup failed: ${errorMessage}`);
    }
  });