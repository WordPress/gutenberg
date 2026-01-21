//! WordPress UltraHDR WASM Library
//!
//! A GPLv2-compatible Rust library implementing ISO 21496-1 (UltraHDR/gain map)
//! specification, compiled to WebAssembly for integration with WordPress Gutenberg's
//! client-side media processing.
//!
//! # Features
//!
//! - **Detection**: Check if a JPEG contains UltraHDR/gain map data
//! - **Decoding**: Extract SDR base, gain map, and metadata from UltraHDR JPEGs
//! - **Encoding**: Create UltraHDR JPEGs from SDR + HDR image pairs
//! - **SDR Extraction**: Extract backwards-compatible SDR image
//!
//! # Standards Support
//!
//! - ISO 21496-1:2025 (Gain map metadata)
//! - Google UltraHDR v1 (Android compatibility)
//! - Adobe Gain Map specification
//!
//! # License
//!
//! GPL-2.0-or-later

#![allow(clippy::unused_unit)]

use wasm_bindgen::prelude::*;

pub mod error;
pub mod gainmap;
pub mod jpeg;
pub mod types;
pub mod ultrahdr;

pub use error::{Result, UltraHdrError};
// Types are exported via wasm_bindgen annotations in types.rs

/// Initializes the WASM module.
///
/// This should be called before using any other functions.
#[wasm_bindgen(start)]
pub fn init() {
    // Module initialization - currently no-op but reserved for future setup
}

/// Checks if a JPEG buffer contains UltraHDR/gain map data.
///
/// This is a fast check that looks for gain map metadata in the XMP
/// or MPF segments without fully decoding the image.
///
/// # Arguments
/// * `buffer` - JPEG file contents as bytes
///
/// # Returns
/// `true` if the image contains gain map metadata, `false` otherwise
///
/// # Example (JavaScript)
/// ```js
/// const buffer = await file.arrayBuffer();
/// const isHdr = isUltraHdr(new Uint8Array(buffer));
/// ```
#[wasm_bindgen(js_name = isUltraHdr)]
pub fn is_ultra_hdr(buffer: &[u8]) -> bool {
    ultrahdr::has_gainmap_metadata(buffer)
}

/// Decodes an UltraHDR JPEG, extracting SDR base, gain map, and metadata.
///
/// # Arguments
/// * `buffer` - UltraHDR JPEG file contents as bytes
///
/// # Returns
/// A `UltraHdrDecodeResult` containing:
/// - `sdrImage`: The SDR base image as JPEG bytes
/// - `gainMap`: The gain map as JPEG bytes
/// - `metadata`: Gain map metadata (version, gains, gamma, offsets, etc.)
/// - `width`, `height`: Image dimensions
/// - `gainMapWidth`, `gainMapHeight`: Gain map dimensions
///
/// # Errors
/// Returns an error if the buffer is not a valid UltraHDR JPEG.
#[wasm_bindgen(js_name = decodeUltraHdr)]
pub fn decode_ultra_hdr(buffer: &[u8]) -> std::result::Result<UltraHdrDecodeResult, JsValue> {
    ultrahdr::decode(buffer).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Encodes an UltraHDR JPEG from SDR and HDR inputs.
///
/// # Arguments
/// * `sdr_buffer` - SDR JPEG image bytes
/// * `hdr_buffer` - HDR image as linear RGB float32 array (3 values per pixel, normalized to [0,1])
/// * `options` - Encoding options (quality, HDR capacity, etc.)
///
/// # Returns
/// The encoded UltraHDR JPEG as bytes.
///
/// # Errors
/// Returns an error if:
/// - The SDR buffer is not a valid JPEG
/// - The HDR buffer size doesn't match the SDR dimensions
/// - The dimensions are invalid (e.g., odd width/height)
///
/// # Example (JavaScript)
/// ```js
/// const options = new UltraHdrEncodeOptions();
/// options.baseQuality = 90;
/// options.targetHdrCapacity = 3.0;
///
/// const sdrBuffer = await sdrFile.arrayBuffer();
/// const hdrBuffer = await getHdrLinearData(); // Float32Array
///
/// const ultraHdr = encodeUltraHdr(
///     new Uint8Array(sdrBuffer),
///     new Float32Array(hdrBuffer),
///     options
/// );
/// ```
#[wasm_bindgen(js_name = encodeUltraHdr)]
pub fn encode_ultra_hdr(
    sdr_buffer: &[u8],
    hdr_buffer: &[f32],
    options: &UltraHdrEncodeOptions,
) -> std::result::Result<Vec<u8>, JsValue> {
    ultrahdr::encode(sdr_buffer, hdr_buffer, options)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Extracts just the SDR base image from an UltraHDR JPEG.
///
/// This produces a standard JPEG that can be displayed on any device,
/// without the gain map metadata. Useful for backwards compatibility.
///
/// # Arguments
/// * `buffer` - UltraHDR JPEG file contents as bytes
///
/// # Returns
/// A standard JPEG without gain map metadata.
///
/// # Errors
/// Returns an error if the buffer is not a valid JPEG.
#[wasm_bindgen(js_name = extractSdrBase)]
pub fn extract_sdr_base(buffer: &[u8]) -> std::result::Result<Vec<u8>, JsValue> {
    ultrahdr::extract_base(buffer).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Gets gain map metadata from an UltraHDR JPEG without full decode.
///
/// This is faster than `decodeUltraHdr` when you only need the metadata.
///
/// # Arguments
/// * `buffer` - UltraHDR JPEG file contents as bytes
///
/// # Returns
/// The gain map metadata.
///
/// # Errors
/// Returns an error if the buffer doesn't contain gain map metadata.
#[wasm_bindgen(js_name = getMetadata)]
pub fn get_metadata(buffer: &[u8]) -> std::result::Result<GainMapMetadata, JsValue> {
    ultrahdr::extract_metadata(buffer).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Creates default encoding options.
///
/// # Returns
/// `UltraHdrEncodeOptions` with sensible defaults:
/// - baseQuality: 85
/// - gainMapQuality: 75
/// - targetHdrCapacity: 3.0
/// - includeIsoMetadata: true
/// - includeUltrahdrV1: true
/// - gainMapScale: 1
#[wasm_bindgen(js_name = createDefaultOptions)]
pub fn create_default_options() -> UltraHdrEncodeOptions {
    UltraHdrEncodeOptions::default()
}

/// Creates high quality encoding options.
///
/// # Returns
/// `UltraHdrEncodeOptions` optimized for quality:
/// - baseQuality: 95
/// - gainMapQuality: 85
/// - targetHdrCapacity: 4.0
#[wasm_bindgen(js_name = createHighQualityOptions)]
pub fn create_high_quality_options() -> UltraHdrEncodeOptions {
    UltraHdrEncodeOptions::high_quality()
}

/// Creates small size encoding options.
///
/// # Returns
/// `UltraHdrEncodeOptions` optimized for file size:
/// - baseQuality: 75
/// - gainMapQuality: 65
/// - targetHdrCapacity: 3.0
/// - gainMapScale: 2 (half-size gain map)
#[wasm_bindgen(js_name = createSmallSizeOptions)]
pub fn create_small_size_options() -> UltraHdrEncodeOptions {
    UltraHdrEncodeOptions::small_size()
}

/// Creates default gain map metadata.
///
/// Useful for testing or when creating metadata programmatically.
#[wasm_bindgen(js_name = createDefaultMetadata)]
pub fn create_default_metadata() -> GainMapMetadata {
    GainMapMetadata::default()
}

/// Validates gain map metadata.
///
/// # Arguments
/// * `metadata` - The metadata to validate
///
/// # Returns
/// `true` if the metadata is valid, `false` otherwise
#[wasm_bindgen(js_name = validateMetadata)]
pub fn validate_metadata(metadata: &GainMapMetadata) -> bool {
    gainmap::metadata::validate_metadata(metadata).is_ok()
}

/// Estimates the HDR headroom from metadata.
///
/// # Arguments
/// * `metadata` - The gain map metadata
///
/// # Returns
/// The maximum additional stops of dynamic range above SDR.
#[wasm_bindgen(js_name = estimateHdrHeadroom)]
pub fn estimate_hdr_headroom(metadata: &GainMapMetadata) -> f32 {
    gainmap::metadata::estimate_hdr_headroom(metadata)
}

/// Checks if metadata indicates a meaningful HDR image.
///
/// # Arguments
/// * `metadata` - The gain map metadata
///
/// # Returns
/// `true` if the gain map provides significant dynamic range extension
/// (more than half a stop).
#[wasm_bindgen(js_name = isMeaningfulHdr)]
pub fn is_meaningful_hdr(metadata: &GainMapMetadata) -> bool {
    gainmap::metadata::is_meaningful_hdr(metadata)
}

// Re-export types for use in WASM
pub use types::{ColorGamut, GainMapMetadata, TransferFunction, UltraHdrDecodeResult, UltraHdrEncodeOptions};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_ultra_hdr_non_jpeg() {
        assert!(!is_ultra_hdr(&[]));
        assert!(!is_ultra_hdr(&[0x89, 0x50, 0x4E, 0x47])); // PNG
    }

    #[test]
    fn test_is_ultra_hdr_regular_jpeg() {
        // Minimal JPEG without gain map
        let jpeg = vec![0xFF, 0xD8, 0xFF, 0xD9];
        assert!(!is_ultra_hdr(&jpeg));
    }

    #[test]
    fn test_create_default_options() {
        let opts = create_default_options();
        assert_eq!(opts.base_quality, 85);
        assert_eq!(opts.gain_map_quality, 75);
        assert_eq!(opts.target_hdr_capacity, 3.0);
    }

    #[test]
    fn test_create_high_quality_options() {
        let opts = create_high_quality_options();
        assert_eq!(opts.base_quality, 95);
        assert_eq!(opts.target_hdr_capacity, 4.0);
    }

    #[test]
    fn test_validate_metadata() {
        let metadata = create_default_metadata();
        assert!(validate_metadata(&metadata));
    }

    #[test]
    fn test_estimate_hdr_headroom() {
        let metadata = create_default_metadata();
        assert!(estimate_hdr_headroom(&metadata) > 0.0);
    }
}
