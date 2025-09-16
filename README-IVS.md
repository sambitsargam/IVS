# Infection Vulnerability Score (IVS) Smart Contract

A privacy-preserving infection vulnerability scoring system built on Zama's fhEVM (Fully Homomorphic Encryption Virtual Machine).

## Overview

The IVS system computes infection vulnerability scores for users in a contact network while preserving privacy through fully homomorphic encryption. Health statuses remain encrypted throughout the computation process, ensuring sensitive medical information never leaves encrypted form on-chain.

## Features

- **Privacy-Preserving**: Health status and IVS scores are fully encrypted using Zama's fhEVM
- **Contact Network Analysis**: Implements level-synchronous BFS propagation algorithm
- **Role-Based Access Control**: Admin-only functions for system management
- **Comprehensive Data Management**: User registration, contact management, and data deletion

## Architecture

### Core Components

1. **Encrypted Data Storage**
   - User health status (0/1) stored as `euint8`
   - IVS scores stored as `euint32`
   - Contact adjacency lists in plaintext for efficient traversal

2. **Access Control**
   - Admin-only functions for system management
   - User registration and data management
   - Secure decryption callbacks with signature verification

3. **IVS Computation Algorithm**
   - Level-synchronous BFS propagation
   - Weighted contributions by distance: 1/2^(depth+1)
   - Plaintext visited tracking to avoid encrypted conditionals

## Contract Functions

### User Management
- `registerUser(uint256 userId)`: Register a new user
- `setHealthStatus(uint256 userId, externalEuint8 encStatus, bytes inputProof)`: Set encrypted health status
- `addContact(uint256 userA, uint256 userB)`: Add bidirectional contact

### IVS Computation
- `computeIVS(uint256 Dmax)`: Compute IVS scores for all users (admin only)
- `getEncryptedIVS(uint256 userId)`: Get encrypted IVS score
- `getDecryptedIVS(uint256 userId)`: Request IVS decryption (admin only)

### Admin Functions
- `deleteUser(uint256 userId)`: Delete user and associated data
- `wipeAllData()`: Clear all system data
- `changeAdmin(address newAdmin)`: Transfer admin rights

## Zama Protocol Integration

This contract follows Zama's fhEVM documentation patterns:

- **Encryption**: [Basic Encryption Example](https://docs.zama.ai/protocol/examples/basic/encryption)
- **FHE Operations**: [FHE Operations Guide](https://docs.zama.ai/protocol/examples/basic/fhe-operations)
- **Decryption**: [Decryption in Solidity](https://docs.zama.ai/protocol/examples/basic/decryption-in-solidity)

### Key Technical Details

1. **Encrypted Types**: Uses `euint8` for health status, `euint32` for IVS scores
2. **Permission Management**: Proper `FHE.allowThis()` and `FHE.allow()` usage
3. **Decryption Flow**: Async decryption with signature verification
4. **FHE Operations**: Encrypted arithmetic for score computation

## Example Usage

### 5-User Network Example

```
Users: [1, 2, 3, 4, 5]
Contacts: 
  - User 1: [2, 3]
  - User 2: [1, 4] 
  - User 3: [1, 5]
  - User 4: [2]
  - User 5: [3]

Health Status:
  - User 1: 1 (infected)
  - Users 2,3,4,5: 0 (healthy)

Expected IVS (Dmax=2, weight=1/2^(depth+1)):
  - User 1: 0.5    (✅ Verified: 5000 raw → 0.500)
  - User 2: 0.25   (✅ Verified: 2500 raw → 0.250)
  - User 3: 0.25   (✅ Verified: 2500 raw → 0.250)
  - User 4: 0.125  (✅ Verified: 1250 raw → 0.125)
  - User 5: 0.125  (✅ Verified: 1250 raw → 0.125)
```

## Live Deployment

### Sepolia Testnet
- **Contract Address**: `0x2EfBcd13eBd66eEEb745e7eA52D3128a8Eb481ba`
- **Network**: Sepolia Testnet
- **Verification**: ✅ Etherscan Verified
- **Status**: Live and operational with verified algorithm accuracy

### Testing Commands
```bash
# Setup test scenario
npx hardhat task:ivs-setup-test --network sepolia

# Compute IVS scores
npx hardhat task:ivs-compute --dmax 2 --network sepolia

# Decrypt IVS scores
npx hardhat task:ivs-decrypt --userid 1 --network sepolia

# Decrypt health status
npx hardhat task:ivs-decrypt-health --userid 1 --network sepolia

# Listen for events
npx hardhat task:ivs-listen-decrypt --network sepolia

## Development Setup

### Prerequisites

- Node.js v18+
- Hardhat development environment
- Zama fhEVM Hardhat template

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd IVS

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat run deploy/deploy-ivs.ts --network localhost
```

### Testing

The test suite includes:
- User registration and management
- Contact network setup
- Admin function access control
- IVS computation verification
- View function testing

Note: Full encryption/decryption testing requires proper FHEVM SDK integration.

## Security Considerations

### Access Control
- Admin-only functions protected by `onlyAdmin` modifier
- User registration required for all operations
- Proper permission management for encrypted data

### Encryption Security
- All sensitive data (health status, IVS scores) encrypted
- Signature verification in decryption callbacks
- Proper key management assumed via Zama protocol

### Algorithm Security
- Plaintext contact lists for efficiency (non-sensitive data)
- Visited tracking prevents double-counting
- Weight calculation ensures proper distance-based scoring

## Completed Features ✅

1. **✅ Fixed-Point Arithmetic**: Implemented precise fractional weight calculation with verified accuracy
2. **✅ Privacy-Preserving Decryption**: Health status and IVS score decryption with event-based results
3. **✅ Event Indexing**: Comprehensive event logging with data type differentiation
4. **✅ Algorithm Verification**: Live on-chain testing confirms mathematical accuracy
5. **✅ Enhanced Scaling**: Raw values properly converted to meaningful decimal representations

## Future Enhancements

1. **SDK Integration**: Add client-side encryption helpers for easier frontend integration
2. **Gas Optimization**: Optimize for large contact networks (1000+ users)
3. **Batch Operations**: Support batch user registration and contact addition
4. **Mobile Integration**: React Native SDK for mobile health applications
5. **Analytics Dashboard**: Web interface for network visualization and statistics

## References

- [Zama Protocol Documentation](https://docs.zama.ai/protocol)
- [fhEVM Solidity Library](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)

## License

This project is licensed under the BSD-3-Clause-Clear License - see the LICENSE file for details.