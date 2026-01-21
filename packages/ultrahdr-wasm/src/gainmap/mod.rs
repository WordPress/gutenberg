//! Gain map processing module.
//!
//! Implements ISO 21496-1 gain map computation and application.

pub mod math;
pub mod metadata;
pub mod encode;
pub mod decode;

pub use math::*;
pub use metadata::*;
pub use encode::compute_gain_map;
pub use decode::apply_gain_map;
