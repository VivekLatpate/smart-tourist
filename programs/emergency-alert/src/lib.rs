use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("EmergencyAlert1111111111111111111111111111111");

#[program]
pub mod emergency_alert {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let emergency_alert = &mut ctx.accounts.emergency_alert;
        emergency_alert.authority = ctx.accounts.authority.key();
        emergency_alert.alert_counter = 0;
        emergency_alert.bump = ctx.bumps.emergency_alert;
        
        msg!("Emergency Alert System initialized");
        Ok(())
    }

    pub fn trigger_alert(
        ctx: Context<TriggerAlert>,
        alert_type: u8,
        location: String,
        description: String,
    ) -> Result<()> {
        let emergency_alert = &mut ctx.accounts.emergency_alert;
        let alert = &mut ctx.accounts.alert;
        let tourist = &ctx.accounts.tourist;

        // Validate alert type
        require!(alert_type <= 2, ErrorCode::InvalidAlertType);

        // Create alert
        alert.alert_id = emergency_alert.alert_counter;
        alert.tourist = tourist.key();
        alert.alert_type = alert_type;
        alert.location = location.clone();
        alert.description = description.clone();
        alert.timestamp = Clock::get()?.unix_timestamp;
        alert.is_active = true;
        alert.bump = ctx.bumps.alert;

        // Increment counter
        emergency_alert.alert_counter += 1;

        // Emit event
        emit!(AlertTriggered {
            alert_id: alert.alert_id,
            tourist: tourist.key(),
            alert_type,
            location,
            description,
            timestamp: alert.timestamp,
        });

        msg!("Emergency alert triggered: ID {}", alert.alert_id);
        Ok(())
    }

    pub fn resolve_alert(ctx: Context<ResolveAlert>) -> Result<()> {
        let alert = &mut ctx.accounts.alert;
        let tourist = &ctx.accounts.tourist;

        require!(alert.is_active, ErrorCode::AlertAlreadyResolved);
        require!(
            alert.tourist == tourist.key() || 
            ctx.accounts.emergency_alert.authority == tourist.key(),
            ErrorCode::Unauthorized
        );

        alert.is_active = false;

        emit!(AlertResolved {
            alert_id: alert.alert_id,
            tourist: tourist.key(),
            resolved_at: Clock::get()?.unix_timestamp,
        });

        msg!("Alert {} resolved", alert.alert_id);
        Ok(())
    }

    pub fn add_emergency_contact(
        ctx: Context<AddEmergencyContact>,
        contact_type: String,
    ) -> Result<()> {
        let emergency_contact = &mut ctx.accounts.emergency_contact;
        let authority = &ctx.accounts.authority;

        emergency_contact.contact_type = contact_type.clone();
        emergency_contact.contact_address = ctx.accounts.contact_address.key();
        emergency_contact.authority = authority.key();
        emergency_contact.bump = ctx.bumps.emergency_contact;

        emit!(EmergencyContactAdded {
            contact_type,
            contact_address: ctx.accounts.contact_address.key(),
        });

        msg!("Emergency contact added");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + EmergencyAlert::INIT_SPACE,
        seeds = [b"emergency_alert"],
        bump
    )]
    pub emergency_alert: Account<'info, EmergencyAlert>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TriggerAlert<'info> {
    #[account(
        mut,
        seeds = [b"emergency_alert"],
        bump = emergency_alert.bump
    )]
    pub emergency_alert: Account<'info, EmergencyAlert>,
    
    #[account(
        init,
        payer = tourist,
        space = 8 + Alert::INIT_SPACE,
        seeds = [b"alert", emergency_alert.alert_counter.to_le_bytes().as_ref()],
        bump
    )]
    pub alert: Account<'info, Alert>,
    
    #[account(mut)]
    pub tourist: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveAlert<'info> {
    #[account(
        mut,
        seeds = [b"emergency_alert"],
        bump = emergency_alert.bump
    )]
    pub emergency_alert: Account<'info, EmergencyAlert>,
    
    #[account(
        mut,
        seeds = [b"alert", alert.alert_id.to_le_bytes().as_ref()],
        bump = alert.bump
    )]
    pub alert: Account<'info, Alert>,
    
    pub tourist: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(contact_type: String)]
pub struct AddEmergencyContact<'info> {
    #[account(
        mut,
        seeds = [b"emergency_alert"],
        bump = emergency_alert.bump,
        constraint = emergency_alert.authority == authority.key()
    )]
    pub emergency_alert: Account<'info, EmergencyAlert>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + EmergencyContact::INIT_SPACE,
        seeds = [b"emergency_contact", contact_type.as_bytes()],
        bump
    )]
    pub emergency_contact: Account<'info, EmergencyContact>,
    
    /// CHECK: This is the contact address being added
    pub contact_address: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct EmergencyAlert {
    pub authority: Pubkey,
    pub alert_counter: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Alert {
    pub alert_id: u64,
    pub tourist: Pubkey,
    pub alert_type: u8, // 0: PANIC, 1: GEOFENCE, 2: ANOMALY
    pub location: String,
    pub description: String,
    pub timestamp: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct EmergencyContact {
    pub contact_type: String,
    pub contact_address: Pubkey,
    pub authority: Pubkey,
    pub bump: u8,
}

#[event]
pub struct AlertTriggered {
    pub alert_id: u64,
    pub tourist: Pubkey,
    pub alert_type: u8,
    pub location: String,
    pub description: String,
    pub timestamp: i64,
}

#[event]
pub struct AlertResolved {
    pub alert_id: u64,
    pub tourist: Pubkey,
    pub resolved_at: i64,
}

#[event]
pub struct EmergencyContactAdded {
    pub contact_type: String,
    pub contact_address: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid alert type")]
    InvalidAlertType,
    #[msg("Alert already resolved")]
    AlertAlreadyResolved,
    #[msg("Unauthorized")]
    Unauthorized,
}
