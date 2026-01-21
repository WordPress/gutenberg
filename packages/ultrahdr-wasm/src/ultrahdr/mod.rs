//! UltraHDR format handling.
//!
//! Implements encoding and decoding of UltraHDR JPEG images according to
//! ISO 21496-1 and Google's UltraHDR v1 specification.

pub mod encoder;
pub mod decoder;

pub use encoder::encode;
pub use decoder::{decode, has_gainmap_metadata, extract_base, extract_metadata};
