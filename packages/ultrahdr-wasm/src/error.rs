//! Error types for UltraHDR operations.

use thiserror::Error;

/// Errors that can occur during UltraHDR operations.
#[derive(Error, Debug)]
pub enum UltraHdrError {
    /// Invalid JPEG format or corrupted data
    #[error("Invalid JPEG format: {0}")]
    InvalidJpeg(String),

    /// Missing required marker or segment
    #[error("Missing required JPEG marker: {0}")]
    MissingMarker(String),

    /// XMP parsing or validation error
    #[error("XMP error: {0}")]
    XmpError(String),

    /// Gain map metadata error
    #[error("Gain map metadata error: {0}")]
    MetadataError(String),

    /// Image dimension mismatch
    #[error("Image dimension mismatch: SDR {0}x{1}, HDR {2}x{3}")]
    DimensionMismatch(u32, u32, u32, u32),

    /// Invalid dimensions (e.g., odd dimensions)
    #[error("Invalid dimensions: {0}")]
    InvalidDimensions(String),

    /// Invalid quality value
    #[error("Invalid quality value: {0} (must be 1-100)")]
    InvalidQuality(u8),

    /// Invalid HDR capacity values
    #[error("Invalid HDR capacity: min ({0}) must be less than max ({1})")]
    InvalidHdrCapacity(f32, f32),

    /// Image decoding error
    #[error("Image decoding error: {0}")]
    DecodeError(String),

    /// Image encoding error
    #[error("Image encoding error: {0}")]
    EncodeError(String),

    /// Color space conversion error
    #[error("Color space error: {0}")]
    ColorSpaceError(String),

    /// No gain map found in image
    #[error("No gain map found in image")]
    NoGainMap,

    /// I/O error
    #[error("I/O error: {0}")]
    IoError(String),

    /// Unsupported feature
    #[error("Unsupported feature: {0}")]
    Unsupported(String),
}

/// Result type alias for UltraHDR operations.
pub type Result<T> = std::result::Result<T, UltraHdrError>;

impl From<std::io::Error> for UltraHdrError {
    fn from(err: std::io::Error) -> Self {
        UltraHdrError::IoError(err.to_string())
    }
}

impl From<quick_xml::Error> for UltraHdrError {
    fn from(err: quick_xml::Error) -> Self {
        UltraHdrError::XmpError(err.to_string())
    }
}

impl From<image::ImageError> for UltraHdrError {
    fn from(err: image::ImageError) -> Self {
        UltraHdrError::DecodeError(err.to_string())
    }
}
