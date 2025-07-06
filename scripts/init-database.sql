-- Initialize Trojan SOL Bot Database
-- This script creates the necessary tables for the bot

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    wallet_address VARCHAR(44),
    encrypted_private_key TEXT,
    sol_balance DECIMAL(18, 9) DEFAULT 0,
    active_positions INTEGER DEFAULT 0,
    sniper_enabled BOOLEAN DEFAULT FALSE,
    slippage DECIMAL(5, 2) DEFAULT 5.00,
    gas_priority VARCHAR(20) DEFAULT 'Fast',
    auto_approve BOOLEAN DEFAULT FALSE,
    mev_protection BOOLEAN DEFAULT TRUE,
    has_password BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    min_liquidity DECIMAL(18, 2) DEFAULT 1000.00,
    max_market_cap DECIMAL(18, 2) DEFAULT 100000.00,
    default_buy_amount DECIMAL(18, 9) DEFAULT 0.1,
    default_sell_percent INTEGER DEFAULT 100,
    sniper_amount DECIMAL(18, 9) DEFAULT 0.1,
    require_renounced BOOLEAN DEFAULT TRUE,
    require_verified BOOLEAN DEFAULT FALSE,
    referral_code VARCHAR(20),
    referred_by BIGINT,
    create
