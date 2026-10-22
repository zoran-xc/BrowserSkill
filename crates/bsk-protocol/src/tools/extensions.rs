//! Opt-in local extension management; never grants permissions or installs extensions.
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct ExtensionsParams {
    pub session_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
}
