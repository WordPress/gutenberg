//! Shared types for UltraHDR operations.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// ISO 21496-1 Gain Map Metadata.
///
/// This structure contains all the metadata required to interpret and apply
/// a gain map according to the ISO 21496-1 specification.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[wasm_bindgen(getter_with_clone)]
pub struct GainMapMetadata {
    /// Specification version (e.g., "1.0")
    pub version: String,

    /// Whether the base rendition is HDR (false = SDR base, true = HDR base)
    #[wasm_bindgen(js_name = baseRenditionIsHdr)]
    pub base_rendition_is_hdr: bool,

    /// Minimum gain value per channel (RGB), in log2 scale
    #[wasm_bindgen(js_name = gainMapMin)]
    pub gain_map_min: Vec<f32>,

    /// Maximum gain value per channel (RGB), in log2 scale
    #[wasm_bindgen(js_name = gainMapMax)]
    pub gain_map_max: Vec<f32>,

    /// Gamma correction per channel (RGB)
    pub gamma: Vec<f32>,

    /// SDR offset per channel (RGB), used for black point adjustment
    #[wasm_bindgen(js_name = offsetSdr)]
    pub offset_sdr: Vec<f32>,

    /// HDR offset per channel (RGB), used for black point adjustment
    #[wasm_bindgen(js_name = offsetHdr)]
    pub offset_hdr: Vec<f32>,

    /// Minimum HDR capacity (log2 scale) where gain map starts to apply
    #[wasm_bindgen(js_name = hdrCapacityMin)]
    pub hdr_capacity_min: f32,

    /// Maximum HDR capacity (log2 scale) for full HDR output
    #[wasm_bindgen(js_name = hdrCapacityMax)]
    pub hdr_capacity_max: f32,
}

#[wasm_bindgen]
impl GainMapMetadata {
    /// Creates a new GainMapMetadata with default values.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    /// Creates metadata suitable for a typical SDR base with HDR gain map.
    #[wasm_bindgen(js_name = forSdrBase)]
    pub fn for_sdr_base(hdr_capacity_max: f32) -> Self {
        Self {
            version: "1.0".to_string(),
            base_rendition_is_hdr: false,
            gain_map_min: vec![0.0, 0.0, 0.0],
            gain_map_max: vec![hdr_capacity_max, hdr_capacity_max, hdr_capacity_max],
            gamma: vec![1.0, 1.0, 1.0],
            offset_sdr: vec![1.0 / 64.0, 1.0 / 64.0, 1.0 / 64.0],
            offset_hdr: vec![1.0 / 64.0, 1.0 / 64.0, 1.0 / 64.0],
            hdr_capacity_min: 0.0,
            hdr_capacity_max,
        }
    }
}

impl Default for GainMapMetadata {
    fn default() -> Self {
        Self {
            version: "1.0".to_string(),
            base_rendition_is_hdr: false,
            gain_map_min: vec![0.0, 0.0, 0.0],
            gain_map_max: vec![3.0, 3.0, 3.0],
            gamma: vec![1.0, 1.0, 1.0],
            offset_sdr: vec![1.0 / 64.0, 1.0 / 64.0, 1.0 / 64.0],
            offset_hdr: vec![1.0 / 64.0, 1.0 / 64.0, 1.0 / 64.0],
            hdr_capacity_min: 0.0,
            hdr_capacity_max: 3.0,
        }
    }
}

/// Result of decoding an UltraHDR image.
#[derive(Debug, Clone)]
#[wasm_bindgen(getter_with_clone)]
pub struct UltraHdrDecodeResult {
    /// The SDR base image as JPEG bytes
    #[wasm_bindgen(js_name = sdrImage)]
    pub sdr_image: Vec<u8>,

    /// The gain map as grayscale JPEG bytes
    #[wasm_bindgen(js_name = gainMap)]
    pub gain_map: Vec<u8>,

    /// Gain map metadata
    pub metadata: GainMapMetadata,

    /// Image width in pixels
    pub width: u32,

    /// Image height in pixels
    pub height: u32,

    /// Gain map width in pixels (may differ from image width)
    #[wasm_bindgen(js_name = gainMapWidth)]
    pub gain_map_width: u32,

    /// Gain map height in pixels (may differ from image height)
    #[wasm_bindgen(js_name = gainMapHeight)]
    pub gain_map_height: u32,
}

#[wasm_bindgen]
impl UltraHdrDecodeResult {
    /// Creates a new decode result.
    #[wasm_bindgen(constructor)]
    pub fn new(
        sdr_image: Vec<u8>,
        gain_map: Vec<u8>,
        metadata: GainMapMetadata,
        width: u32,
        height: u32,
        gain_map_width: u32,
        gain_map_height: u32,
    ) -> Self {
        Self {
            sdr_image,
            gain_map,
            metadata,
            width,
            height,
            gain_map_width,
            gain_map_height,
        }
    }
}

/// Options for encoding UltraHDR images.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct UltraHdrEncodeOptions {
    /// JPEG quality for the base image (1-100)
    #[wasm_bindgen(js_name = baseQuality)]
    pub base_quality: u8,

    /// JPEG quality for the gain map (1-100)
    #[wasm_bindgen(js_name = gainMapQuality)]
    pub gain_map_quality: u8,

    /// Target HDR capacity (typically 2.0-4.0)
    #[wasm_bindgen(js_name = targetHdrCapacity)]
    pub target_hdr_capacity: f32,

    /// Whether to include ISO 21496-1 metadata
    #[wasm_bindgen(js_name = includeIsoMetadata)]
    pub include_iso_metadata: bool,

    /// Whether to include UltraHDR v1 metadata for Android compatibility
    #[wasm_bindgen(js_name = includeUltrahdrV1)]
    pub include_ultrahdr_v1: bool,

    /// Downscale factor for the gain map (1 = same size, 2 = half, 4 = quarter)
    #[wasm_bindgen(js_name = gainMapScale)]
    pub gain_map_scale: u8,
}

#[wasm_bindgen]
impl UltraHdrEncodeOptions {
    /// Creates encoding options with default values.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    /// Creates options optimized for high quality output.
    #[wasm_bindgen(js_name = highQuality)]
    pub fn high_quality() -> Self {
        Self {
            base_quality: 95,
            gain_map_quality: 85,
            target_hdr_capacity: 4.0,
            include_iso_metadata: true,
            include_ultrahdr_v1: true,
            gain_map_scale: 1,
        }
    }

    /// Creates options optimized for smaller file size.
    #[wasm_bindgen(js_name = smallSize)]
    pub fn small_size() -> Self {
        Self {
            base_quality: 75,
            gain_map_quality: 65,
            target_hdr_capacity: 3.0,
            include_iso_metadata: true,
            include_ultrahdr_v1: true,
            gain_map_scale: 2,
        }
    }
}

impl Default for UltraHdrEncodeOptions {
    fn default() -> Self {
        Self {
            base_quality: 85,
            gain_map_quality: 75,
            target_hdr_capacity: 3.0,
            include_iso_metadata: true,
            include_ultrahdr_v1: true,
            gain_map_scale: 1,
        }
    }
}

/// Color gamut enumeration for HDR images.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum ColorGamut {
    /// Standard sRGB color space (BT.709 primaries)
    Srgb = 0,
    /// Display P3 wide color gamut
    DisplayP3 = 1,
    /// BT.2100/BT.2020 wide color gamut (HDR)
    Bt2100 = 2,
}

impl Default for ColorGamut {
    fn default() -> Self {
        ColorGamut::Srgb
    }
}

/// Transfer function for encoding luminance.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[wasm_bindgen]
pub enum TransferFunction {
    /// sRGB transfer function (gamma ~2.2)
    Srgb = 0,
    /// Linear (no gamma)
    Linear = 1,
    /// Perceptual Quantizer (PQ) - SMPTE ST 2084
    Pq = 2,
    /// Hybrid Log-Gamma (HLG) - BT.2100
    Hlg = 3,
}

impl Default for TransferFunction {
    fn default() -> Self {
        TransferFunction::Srgb
    }
}
