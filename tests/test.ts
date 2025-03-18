import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { SimpleDeposit } from "../target/types/simple_deposit";
import { assert } from "chai";

describe("simple_deposit", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    // Use the exported structure from IDL
    const program = anchor.workspace.SimpleDeposit as Program<SimpleDeposit>;

    // Utility function to fund a new wallet with some SOL.
    async function fundWallet(keypair: web3.Keypair, amount: number) {
        const signature = await provider.connection.requestAirdrop(
            keypair.publicKey,
            amount
        );
        const latestBlockHash = await provider.connection.getLatestBlockhash();
        await provider.connection.confirmTransaction({
            signature,
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        });
    }


    it("deposits lamports into the user deposit account (auto-init if needed)", async () => {
        // Specify the deposit amount.
        const depositAmount = new BN(1000);

        // Derive the PDA for the user's deposit account using the seed "user" and the provider's wallet.
        const [userDepositAccountPDA] = web3.PublicKey.findProgramAddressSync(
            [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
            program.programId
        );

        // Call the deposit instruction. With init_if_needed on Deposit context,
        // the account will be created automatically if it doesn't exist.
        await program.methods.deposit(depositAmount)
            .accounts({
                userDepositAccount: userDepositAccountPDA,
                user: provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        // Fetch the account and verify that the deposit amount was updated.
        const account = await program.account.userDepositAccount.fetch(userDepositAccountPDA);
        assert.strictEqual(account.depositAmount.toNumber(), 1000, "Deposit amount should be 1000 lamports");
    });

    it("fails when depositing zero lamports", async () => {
        // Deposit amount set to zero.
        const depositAmount = new BN(0);

        const [userDepositAccountPDA] = web3.PublicKey.findProgramAddressSync(
            [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
            program.programId
        );


        try {
            await program.methods.deposit(depositAmount)
                .accounts({
                    user_deposit_account: userDepositAccountPDA,
                    user: provider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            // If the transaction succeeds, this is an error.
            assert.fail("Deposit of zero lamports should have failed but did not");
        } catch (error) {
            const errMsg = error.toString();
            console.log("Caught error:", errMsg);

            // Check that the error message includes the expected error code or message.
            // The error message should contain "InvalidAmount" (or the specific error message defined).
            assert.include(errMsg, "InvalidAmount", "Expected InvalidAmount error when depositing zero lamports");
        }
    });


    it("two users deposit", async () => {
        // Create two distinct user Keypairs.
        const user1 = web3.Keypair.generate();
        const user2 = web3.Keypair.generate();

        // Fund both user wallets (e.g. 2 SOL each).
        await fundWallet(user1, 2 * web3.LAMPORTS_PER_SOL);
        await fundWallet(user2, 2 * web3.LAMPORTS_PER_SOL);

        // Derive the PDA for each user's deposit account.
        const [user1DepositPDA] = web3.PublicKey.findProgramAddressSync(
            [Buffer.from("user"), user1.publicKey.toBuffer()],
            program.programId
        );
        const [user2DepositPDA] = web3.PublicKey.findProgramAddressSync(
            [Buffer.from("user"), user2.publicKey.toBuffer()],
            program.programId
        );

        // You can now call deposit for each user and verify separately.
        // For example, user1 deposits 500 lamports.
        await program.methods.deposit(new BN(500))
            .accounts({
                user_deposit_account: user1DepositPDA,
                user: user1.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .signers([user1])
            .rpc();

        await program.methods.deposit(new BN(100)).accounts({
            user_deposit_account: user2DepositPDA,
            user: user2.publicKey,
            systemProgram: web3.SystemProgram.programId,
        }).signers([user2]).rpc();


        // Fetch and verify user1's deposit.
        const user1Account = await program.account.userDepositAccount.fetch(user1DepositPDA);
        const user2Account = await program.account.userDepositAccount.fetch(user2DepositPDA);
        assert.strictEqual(user1Account.depositAmount.toNumber(), 500, "User1 deposit should be 500 lamports");
        assert.strictEqual(user2Account.depositAmount.toNumber(), 100, "User2 deposit should be 100 lamports");
    });
});