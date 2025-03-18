# Simple Deposit Program

This program implements a simple deposit contract on Solana using Anchor.
It allows users to initialize a deposit account,
deposit lamports into it, and retrieve (log) the current deposit amount.

## Overview

The program includes three main instructions:

- **initialize_user**: Creates a per-user deposit account (if it doesn’t exist) with an initial deposit amount of zero.
- **deposit**: Deposits a specified amount of lamports into the user's deposit account.
- **get_deposit**: Logs the current deposit amount stored in the user's deposit account.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.anza.xyz/)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation#install-anchor-cli)
- Node.js and npm (for running tests and client scripts)

For installing Solana CLI, we are using agave, which makes the update process easier.

## Setup Solana CLI

If it's your first time using Solana CLI, you will need to setup its config.
You can find more details of how to point to a proper RPC node, and setup your wallet details on:
- [solana config](https://www.anchor-lang.com/docs/installation#solana-config)

For RPC nodes URL, you can grab one in [Alchemy](https://dashboard.alchemy.com/), in the case endpoint https://api.devnet.solana.com is timed out.


## Project Structure

- `programs/simple_deposit/src/lib.rs`: The Rust program source code.
- `tests/`: Contains tests written in TypeScript to interact with your contract.
- `Anchor.toml`: Configuration file for your Anchor project.

## Building the Program

Run the following command in your project root:

```shell
anchor build
```

This command compiles your program and automatically generates an IDL (in target/idl/simple_deposit.json) that describes your program’s interface.

---

## Deploying the Program

Deploy your program using the Anchor CLI:
```shell
anchor deploy
```

Upon successful deployment, you’ll see output similar to:

```shell
Program Id: 5pPCXDjdnAVZ4QcEJvgvfb11BPtQcAtf1sxXyQweJDKE
Signature: 2PunvaD5KkfE5xmzC7MQ1jE6pCFRhdBZNKBuY73B4412fCYqTL3YAu7DDU1TQfBxzwc5DxPZCwEstTAefYShKbGf
Deploy success
```

The **Program Id** is the on-chain address used to interact with your contract.

---
## Testing

### Local Testing

By default, anchor test spins up a local test validator, deploys your program, and runs your tests in an isolated environment. Run:
```shell
anchor test
```

### Running Tests on Devnet

To run tests on Devnet, update your provider settings either in your `Anchor.toml` file or by setting environment variables.

#### Using `Anchor.toml`

Edit the `[provider]` section in your Anchor.toml:
```shell
[provider]
cluster = "https://api.devnet.solana.com"
wallet = "~/.config/solana/devnet.json"
```

#### Using Environment Variables

Set the following variables in your shell before running tests:
```shell
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET="~/.config/solana/devnet.json"
anchor test
```

**Note**: Devnet state persists between runs. Make sure your Devnet wallet is funded (via Solana CLI airdrop, for example).

## Error Handling

The program includes custom error codes:
- `InvalidAmount`: Returned when depositing zero lamports.
- `MathOverflow`: Returned if a deposit causes an overflow.

Your client code should handle these errors appropriately.

## Summary
- Build: Use anchor build to compile and generate the IDL.
- Deploy: Use anchor deploy to deploy your program.
- Test Locally: Run anchor test for isolated testing.
- Test on Devnet: Update provider settings in Anchor.toml or via environment variables.

For more details and further customization, refer to the Anchor documentation.