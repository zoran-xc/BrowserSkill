//! Extension management through an owner-granted optional permission.
use crate::cli::{
    ensure_daemon::ensure_daemon,
    error::{CliError, Format},
};
use anyhow::Context;
use bsk_protocol::{Method, tools::ExtensionsParams};
use clap::{Args, Subcommand};
use std::time::Duration;
#[derive(Debug, Args)]
pub struct ExtensionsArgs {
    #[arg(long)]
    pub session: String,
    #[command(subcommand)]
    pub command: ExtensionsCommand,
}
#[derive(Debug, Subcommand)]
pub enum ExtensionsCommand {
    List,
    Enable { id: String },
    Disable { id: String },
}
pub fn dispatch(args: ExtensionsArgs, _format: Format) -> Result<(), CliError> {
    let (method, id) = match args.command {
        ExtensionsCommand::List => (Method::ToolExtensionsList, None),
        ExtensionsCommand::Enable { id } => (Method::ToolExtensionsEnable, Some(id)),
        ExtensionsCommand::Disable { id } => (Method::ToolExtensionsDisable, Some(id)),
    };
    let info = ensure_daemon().context("ensure daemon is running")?;
    let reply: serde_json::Value = crate::cli::business_rpc::call(
        info.sock_path,
        "extensions-1",
        method,
        Some(ExtensionsParams {
            session_id: args.session,
            id,
        }),
        Duration::from_secs(35),
    )?;
    println!(
        "{}",
        serde_json::to_string_pretty(&reply).map_err(|e| CliError::Local(e.into()))?
    );
    Ok(())
}
