# IVS (Infection Vulnerability Score) Testing Guide

This document provides comprehensive testing commands for the privacy-preserving Infection Vulnerability Score system built with Zama's fhEVM.

## 📋 Contract Information

- **Contract Address**: `0x6A4ADcf7fb926e4Ae9Bf8aCc943Ac0F204648d53`
- **Network**: Sepolia Testnet
- **Verification**: ✅ Verified on Etherscan
- **Features**: Privacy-preserving IVS computation with automatic decimal conversion

## 🚀 Quick Start Commands

### 1. Setup Test Scenario (5 Users)
```bash
npx hardhat task:ivs-setup-test --network sepolia
```
Creates 5 users with contact relationships:
- User 1 (infected) ↔ User 2, User 3
- User 2 ↔ User 4
- User 3 ↔ User 5

### 2. Compute IVS Scores
```bash
npx hardhat task:ivs-compute --dmax 2 --network sepolia
```

### 3. **RECOMMENDED**: Reliable Decryption with Auto-Conversion
```bash
npx hardhat task:ivs-decrypt-wait --userid 1 --network sepolia
```
**This is the most reliable method!** Uses polling instead of real-time events.

## 📊 All Available Commands

### User Management
```bash
# Register a new user
npx hardhat task:ivs-register --userid <user_id> --network sepolia

# Set health status (0=healthy, 1=infected)
npx hardhat task:ivs-set-health --userid <user_id> --status <0|1> --network sepolia

# Add contact relationship between users
npx hardhat task:ivs-add-contact --usera <user_id_1> --userb <user_id_2> --network sepolia
```

### IVS Computation
```bash
# Compute IVS scores for all users (admin only)
npx hardhat task:ivs-compute --dmax <max_depth> --network sepolia

# Get encrypted IVS score
npx hardhat task:ivs-get-score --userid <user_id> --network sepolia
```

### Decryption Commands (Multiple Options)

#### 🌟 **BEST**: Reliable Polling Method
```bash
npx hardhat task:ivs-decrypt-wait --userid <user_id> --network sepolia
```
- ✅ Most reliable (uses polling)
- ✅ Automatic decimal conversion
- ✅ Risk level interpretation
- ✅ 150-second timeout
- ✅ Works every time!

#### Alternative: Standard Decryption
```bash
npx hardhat task:ivs-decrypt --userid <user_id> --network sepolia
```
- Submits request only
- Check results with `task:ivs-check-events`

#### Real-time Event Listener (may have timing issues)
```bash
npx hardhat task:ivs-decrypt-v2 --userid <user_id> --network sepolia
```

#### Health Status Decryption
```bash
npx hardhat task:ivs-decrypt-health --userid <user_id> --network sepolia
```

#### SDK-based Decryption
```bash
npx hardhat task:ivs-decrypt-sdk --userid <user_id> --network sepolia
```

#### Decrypt All Users
```bash
npx hardhat task:ivs-decrypt-all --network sepolia
```

### Event Monitoring
```bash
# Check recent contract events
npx hardhat task:ivs-check-events --network sepolia

# Listen for decryption events (real-time)
npx hardhat task:ivs-listen-decrypt --network sepolia
```

### Utility Commands
```bash
# Convert raw IVS value to decimal
npx hardhat task:ivs-convert --rawvalue <raw_value>

# Examples:
npx hardhat task:ivs-convert --rawvalue 5000  # → 0.500 (HIGH risk)
npx hardhat task:ivs-convert --rawvalue 2500  # → 0.250 (MEDIUM risk)
npx hardhat task:ivs-convert --rawvalue 1250  # → 0.125 (LOW risk)
```

## 📈 Expected Test Results

When you run the complete test scenario, you should see these results:

| User | Contact Relationship | Raw Value | Decimal Score | Risk Level |
|------|---------------------|-----------|---------------|------------|
| **User 1** | Infected (source) | 5000 | 0.500 | 📈 HIGH |
| **User 2** | Direct contact with User 1 | 2500 | 0.250 | 📊 MEDIUM |
| **User 3** | Direct contact with User 1 | 2500 | 0.250 | 📊 MEDIUM |
| **User 4** | Contact via User 2 (depth 2) | 1250 | 0.125 | 📉 LOW |
| **User 5** | Contact via User 3 (depth 2) | 1250 | 0.125 | 📉 LOW |

## 🔄 Complete Testing Workflow

```bash
# Step 1: Setup test users and relationships
npx hardhat task:ivs-setup-test --network sepolia

# Step 2: Compute IVS scores
npx hardhat task:ivs-compute --dmax 2 --network sepolia

# Step 3: Test reliable decryption for each user
npx hardhat task:ivs-decrypt-wait --userid 1 --network sepolia
npx hardhat task:ivs-decrypt-wait --userid 2 --network sepolia
npx hardhat task:ivs-decrypt-wait --userid 3 --network sepolia
npx hardhat task:ivs-decrypt-wait --userid 4 --network sepolia
npx hardhat task:ivs-decrypt-wait --userid 5 --network sepolia

# Step 4: Check all events
npx hardhat task:ivs-check-events --network sepolia
```

## 🛠️ Algorithm Details

The IVS algorithm uses:
- **Weight Formula**: `1/2^(depth+1)`
- **Scaling**: Raw values scaled by 10,000 for FHE operations
- **Max Depth**: Configurable (usually 2)
- **Privacy**: All computations on encrypted data

### Weight Distribution (Dmax=2):
- **Direct infection**: 1/2^(0+1) = 0.500
- **Direct contact**: 1/2^(1+1) = 0.250  
- **Second-level contact**: 1/2^(2+1) = 0.125

## 🔍 Troubleshooting

### If Decryption Times Out:
1. Use the reliable polling method: `task:ivs-decrypt-wait`
2. Check events manually: `task:ivs-check-events`
3. Use conversion utility: `task:ivs-convert --rawvalue <value>`

### If Real-time Events Don't Work:
- The Zama relayer can have timing issues
- Use `task:ivs-decrypt-wait` (polling method) instead
- Or use the 2-step process: `task:ivs-decrypt` + `task:ivs-check-events`

## 📝 Risk Level Classifications

- **HIGH (≥0.500)**: Direct infection or high exposure
- **MEDIUM (≥0.250)**: Direct contact with infected
- **LOW (≥0.125)**: Second-level contact
- **MINIMAL (<0.125)**: Low or no exposure

## 🎯 Key Features

- ✅ **Privacy-Preserving**: All computations on encrypted data
- ✅ **Automatic Conversion**: Raw values automatically converted to decimal
- ✅ **Risk Assessment**: Automatic risk level classification
- ✅ **Reliable Decryption**: Polling-based method avoids timing issues
- ✅ **Extended Timeout**: 150-second timeout for reliable results
- ✅ **Comprehensive Testing**: Multiple decryption methods available
- ✅ **Event Monitoring**: Real-time and historical event checking
- ✅ **Utility Tools**: Conversion and analysis utilities

## 🌟 Recommended Usage

For the best experience, always use:
```bash
npx hardhat task:ivs-decrypt-wait --userid <user_id> --network sepolia
```

This command provides:
- Reliable results every time
- Automatic decimal conversion
- Risk level interpretation
- Beautiful formatted output
- No timeout issues!