use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use mpl_token_metadata::{
    instructions::{CreateV1, CreateV1InstructionArgs, MintV1, MintV1InstructionArgs},
    types::{DataV2, PrintSupply},
};

declare_id!("TempAccessNFT1111111111111111111111111111111");

#[program]
pub mod temporary_access_nft {
    use super::*;

    /// Initialize the Temporary Access NFT program
    /// This sets up the program authority and configuration
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let program_config = &mut ctx.accounts.program_config;
        program_config.authority = ctx.accounts.authority.key();
        program_config.nft_counter = 0;
        program_config.bump = ctx.bumps.program_config;
        
        msg!("Temporary Access NFT Program initialized");
        Ok(())
    }

    /// Mint a temporary access NFT for a tourist
    /// This creates a soulbound NFT that cannot be transferred
    pub fn mint_access_nft(
        ctx: Context<MintAccessNft>,
        tourist_id_hash: [u8; 32],
        zone_id: String,
        expiry_timestamp: i64,
        metadata_uri: String,
    ) -> Result<()> {
        let program_config = &mut ctx.accounts.program_config;
        let access_nft = &mut ctx.accounts.access_nft;
        let tourist = &ctx.accounts.tourist;

        // Validate expiry timestamp is in the future
        let current_time = Clock::get()?.unix_timestamp;
        require!(expiry_timestamp > current_time, ErrorCode::InvalidExpiryTime);

        // Create the access NFT account
        access_nft.nft_id = program_config.nft_counter;
        access_nft.tourist_id_hash = tourist_id_hash;
        access_nft.zone_id = zone_id.clone();
        access_nft.expiry_timestamp = expiry_timestamp;
        access_nft.tourist_wallet = tourist.key();
        access_nft.is_valid = true;
        access_nft.metadata_uri = metadata_uri.clone();
        access_nft.minted_at = current_time;
        access_nft.bump = ctx.bumps.access_nft;

        // Increment NFT counter
        program_config.nft_counter += 1;

        // Emit event for tracking
        emit!(AccessNftMinted {
            nft_id: access_nft.nft_id,
            tourist_wallet: tourist.key(),
            tourist_id_hash,
            zone_id,
            expiry_timestamp,
            metadata_uri,
            minted_at: current_time,
        });

        msg!("Temporary Access NFT minted: ID {}", access_nft.nft_id);
        Ok(())
    }

    /// Verify if a tourist has valid access to a specific zone
    /// Returns true if the NFT exists, is valid, and not expired
    pub fn verify_access(
        ctx: Context<VerifyAccess>,
        tourist_wallet: Pubkey,
        zone_id: String,
    ) -> Result<bool> {
        let access_nft = &ctx.accounts.access_nft;
        let current_time = Clock::get()?.unix_timestamp;

        // Check if NFT is valid and not expired
        let is_valid = access_nft.is_valid 
            && access_nft.tourist_wallet == tourist_wallet
            && access_nft.zone_id == zone_id
            && access_nft.expiry_timestamp > current_time;

        // Emit verification event
        emit!(AccessVerified {
            nft_id: access_nft.nft_id,
            tourist_wallet,
            zone_id,
            is_valid,
            verified_at: current_time,
        });

        msg!("Access verification for zone {}: {}", zone_id, is_valid);
        Ok(is_valid)
    }

    /// Revoke access pass by authority (tourism department)
    /// This invalidates the NFT before its natural expiry
    pub fn revoke_pass(ctx: Context<RevokePass>) -> Result<()> {
        let access_nft = &mut ctx.accounts.access_nft;
        let authority = &ctx.accounts.authority;

        // Check if NFT is currently valid
        require!(access_nft.is_valid, ErrorCode::PassAlreadyRevoked);

        // Mark as invalid
        access_nft.is_valid = false;

        // Emit revocation event
        emit!(PassRevoked {
            nft_id: access_nft.nft_id,
            tourist_wallet: access_nft.tourist_wallet,
            zone_id: access_nft.zone_id.clone(),
            revoked_by: authority.key(),
            revoked_at: Clock::get()?.unix_timestamp,
        });

        msg!("Access pass revoked: NFT ID {}", access_nft.nft_id);
        Ok(())
    }

    /// Update NFT metadata (only by authority)
    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        new_metadata_uri: String,
    ) -> Result<()> {
        let access_nft = &mut ctx.accounts.access_nft;
        
        access_nft.metadata_uri = new_metadata_uri.clone();

        emit!(MetadataUpdated {
            nft_id: access_nft.nft_id,
            new_metadata_uri,
            updated_at: Clock::get()?.unix_timestamp,
        });

        msg!("Metadata updated for NFT ID {}", access_nft.nft_id);
        Ok(())
    }
}

// Account validation structs

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [b"program_config"],
        bump
    )]
    pub program_config: Account<'info, ProgramConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tourist_id_hash: [u8; 32], zone_id: String)]
pub struct MintAccessNft<'info> {
    #[account(
        mut,
        seeds = [b"program_config"],
        bump = program_config.bump
    )]
    pub program_config: Account<'info, ProgramConfig>,
    
    #[account(
        init,
        payer = tourist,
        space = 8 + AccessNft::INIT_SPACE,
        seeds = [b"access_nft", program_config.nft_counter.to_le_bytes().as_ref()],
        bump
    )]
    pub access_nft: Account<'info, AccessNft>,
    
    #[account(mut)]
    pub tourist: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tourist_wallet: Pubkey, zone_id: String)]
pub struct VerifyAccess<'info> {
    #[account(
        seeds = [b"access_nft", access_nft.nft_id.to_le_bytes().as_ref()],
        bump = access_nft.bump,
        constraint = access_nft.tourist_wallet == tourist_wallet,
        constraint = access_nft.zone_id == zone_id
    )]
    pub access_nft: Account<'info, AccessNft>,
}

#[derive(Accounts)]
pub struct RevokePass<'info> {
    #[account(
        mut,
        seeds = [b"access_nft", access_nft.nft_id.to_le_bytes().as_ref()],
        bump = access_nft.bump
    )]
    pub access_nft: Account<'info, AccessNft>,
    
    #[account(
        mut,
        seeds = [b"program_config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key()
    )]
    pub program_config: Account<'info, ProgramConfig>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(
        mut,
        seeds = [b"access_nft", access_nft.nft_id.to_le_bytes().as_ref()],
        bump = access_nft.bump
    )]
    pub access_nft: Account<'info, AccessNft>,
    
    #[account(
        mut,
        seeds = [b"program_config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key()
    )]
    pub program_config: Account<'info, ProgramConfig>,
    
    pub authority: Signer<'info>,
}

// Account data structures

#[account]
#[derive(InitSpace)]
pub struct ProgramConfig {
    pub authority: Pubkey,
    pub nft_counter: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AccessNft {
    pub nft_id: u64,
    pub tourist_id_hash: [u8; 32], // Soulbound binding to tourist digital ID
    pub zone_id: String,           // Restricted area/park/site identifier
    pub expiry_timestamp: i64,     // Unix time after which access is revoked
    pub tourist_wallet: Pubkey,    // Tourist's wallet address
    pub is_valid: bool,            // Whether the pass is currently valid
    pub metadata_uri: String,      // IPFS/Arweave metadata URI
    pub minted_at: i64,            // When the NFT was minted
    pub bump: u8,
}

// Events

#[event]
pub struct AccessNftMinted {
    pub nft_id: u64,
    pub tourist_wallet: Pubkey,
    pub tourist_id_hash: [u8; 32],
    pub zone_id: String,
    pub expiry_timestamp: i64,
    pub metadata_uri: String,
    pub minted_at: i64,
}

#[event]
pub struct AccessVerified {
    pub nft_id: u64,
    pub tourist_wallet: Pubkey,
    pub zone_id: String,
    pub is_valid: bool,
    pub verified_at: i64,
}

#[event]
pub struct PassRevoked {
    pub nft_id: u64,
    pub tourist_wallet: Pubkey,
    pub zone_id: String,
    pub revoked_by: Pubkey,
    pub revoked_at: i64,
}

#[event]
pub struct MetadataUpdated {
    pub nft_id: u64,
    pub new_metadata_uri: String,
    pub updated_at: i64,
}

// Error codes

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid expiry time - must be in the future")]
    InvalidExpiryTime,
    #[msg("Pass already revoked")]
    PassAlreadyRevoked,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("NFT not found")]
    NftNotFound,
    #[msg("Access expired")]
    AccessExpired,
}
