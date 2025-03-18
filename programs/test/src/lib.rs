use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("6bbw86m5r9vdUPLY4v2kaWwRwFoyLnq6jJANssxXXYdd");

#[program]
pub mod simple_deposit {
    use super::*;

    /// Creates a per-user deposit account with an initial deposit_amount of zero.
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_deposit = &mut ctx.accounts.user_deposit_account;
        user_deposit.deposit_amount = 0;
        msg!("User deposit account initialized with 0 lamports.");
        Ok(())
    }

    /// Deposits a specified amount of lamports into the user's deposit account.
    /// If the account is not yet created, it will be initialized automatically.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer lamports from the user's wallet to the deposit account.
        anchor_lang::solana_program::program::invoke(
            &system_instruction::transfer(
                &ctx.accounts.user.key(),
                &ctx.accounts.user_deposit_account.key(),
                amount,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.user_deposit_account.to_account_info(),
            ],
        )?;

        // Update the stored deposit amount.
        let user_deposit = &mut ctx.accounts.user_deposit_account;
        user_deposit.deposit_amount = user_deposit
            .deposit_amount
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        msg!("Deposited {} lamports.", amount);
        Ok(())
    }

    /// Logs the current deposit amount.
    pub fn get_deposit(ctx: Context<GetDeposit>) -> Result<()> {
        let deposit = ctx.accounts.user_deposit_account.deposit_amount;
        msg!("Current deposit: {} lamports.", deposit);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    // This instruction is separate from deposit.
    // (You may not need this if using deposit with init_if_needed.)
    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"user", user.key().as_ref()],
        bump,
        space = 8 + 8 // 8 bytes for discriminator + 8 bytes for deposit_amount (u64)
    )]
    pub user_deposit_account: Account<'info, UserDepositAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        init_if_needed, // Auto-initialize if the account doesn't exist.
        payer = user,
        seeds = [b"user", user.key().as_ref()],
        bump,
        space = 8 + 8
    )]
    pub user_deposit_account: Account<'info, UserDepositAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetDeposit<'info> {
    pub user_deposit_account: Account<'info, UserDepositAccount>,
}

#[account]
pub struct UserDepositAccount {
    pub deposit_amount: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The deposited amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Math overflow occurred.")]
    MathOverflow,
}