//! Gain map encoding (computation from SDR + HDR image pair).
//!
//! Implements the gain map computation algorithm from ISO 21496-1.

use crate::error::{Result, UltraHdrError};
use crate::types::GainMapMetadata;
use super::math::{encode_gain, compute_gain_ratio, srgb_to_linear};
use super::metadata::MetadataComputer;

/// Computes a gain map from an SDR and HDR image pair.
///
/// # Arguments
/// * `sdr_rgb` - SDR image as RGB bytes (sRGB encoded, 3 bytes per pixel)
/// * `hdr_linear` - HDR image as linear RGB floats (3 floats per pixel, [0..1] normalized)
/// * `width` - Image width
/// * `height` - Image height
/// * `target_capacity` - Target HDR capacity (typically 2.0-4.0)
/// * `gain_map_scale` - Downscale factor for gain map (1 = full size, 2 = half, etc.)
///
/// # Returns
/// A tuple of (gain_map_bytes, metadata) where gain_map_bytes is a grayscale
/// image representing the per-pixel gain values.
pub fn compute_gain_map(
    sdr_rgb: &[u8],
    hdr_linear: &[f32],
    width: u32,
    height: u32,
    target_capacity: f32,
    gain_map_scale: u8,
) -> Result<(Vec<u8>, GainMapMetadata)> {
    let pixel_count = (width * height) as usize;

    // Validate input sizes
    if sdr_rgb.len() != pixel_count * 3 {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "SDR buffer size {} doesn't match {}x{}x3 = {}",
            sdr_rgb.len(), width, height, pixel_count * 3
        )));
    }
    if hdr_linear.len() != pixel_count * 3 {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "HDR buffer size {} doesn't match {}x{}x3 = {}",
            hdr_linear.len(), width, height, pixel_count * 3
        )));
    }

    let scale = gain_map_scale.max(1) as u32;
    let gm_width = (width + scale - 1) / scale;
    let gm_height = (height + scale - 1) / scale;
    let gm_pixel_count = (gm_width * gm_height) as usize;

    // First pass: compute statistics for metadata
    let mut metadata_computer = MetadataComputer::new();
    let offset = 1.0 / 64.0; // Standard offset

    // Sample every Nth pixel for statistics (for performance)
    let sample_step = ((width * height) / 10000).max(1) as usize;

    for i in (0..pixel_count).step_by(sample_step) {
        let sdr_r = sdr_rgb[i * 3] as f32 / 255.0;
        let sdr_g = sdr_rgb[i * 3 + 1] as f32 / 255.0;
        let sdr_b = sdr_rgb[i * 3 + 2] as f32 / 255.0;

        // Convert SDR from sRGB to linear
        let (sdr_lin_r, sdr_lin_g, sdr_lin_b) = srgb_to_linear(sdr_r, sdr_g, sdr_b);

        let hdr_r = hdr_linear[i * 3];
        let hdr_g = hdr_linear[i * 3 + 1];
        let hdr_b = hdr_linear[i * 3 + 2];

        metadata_computer.add_sample(
            [sdr_lin_r, sdr_lin_g, sdr_lin_b],
            [hdr_r, hdr_g, hdr_b],
            offset,
            offset,
        );
    }

    let metadata = metadata_computer.compute(target_capacity);

    // Second pass: compute gain map
    let mut gain_map = vec![0u8; gm_pixel_count];

    for gy in 0..gm_height {
        for gx in 0..gm_width {
            // Sample center of the gain map pixel's coverage area
            let sx = ((gx * scale + scale / 2).min(width - 1)) as usize;
            let sy = ((gy * scale + scale / 2).min(height - 1)) as usize;
            let src_idx = sy * width as usize + sx;

            // Get SDR values and convert to linear
            let sdr_r = sdr_rgb[src_idx * 3] as f32 / 255.0;
            let sdr_g = sdr_rgb[src_idx * 3 + 1] as f32 / 255.0;
            let sdr_b = sdr_rgb[src_idx * 3 + 2] as f32 / 255.0;
            let (sdr_lin_r, sdr_lin_g, sdr_lin_b) = srgb_to_linear(sdr_r, sdr_g, sdr_b);

            // Get HDR values (already linear)
            let hdr_r = hdr_linear[src_idx * 3];
            let hdr_g = hdr_linear[src_idx * 3 + 1];
            let hdr_b = hdr_linear[src_idx * 3 + 2];

            // Compute gain ratio for each channel
            let ratio_r = compute_gain_ratio(sdr_lin_r, hdr_r, offset, offset);
            let ratio_g = compute_gain_ratio(sdr_lin_g, hdr_g, offset, offset);
            let ratio_b = compute_gain_ratio(sdr_lin_b, hdr_b, offset, offset);

            // Encode gains
            let gain_r = encode_gain(ratio_r, metadata.gain_map_min[0], metadata.gain_map_max[0], metadata.gamma[0]);
            let gain_g = encode_gain(ratio_g, metadata.gain_map_min[1], metadata.gain_map_max[1], metadata.gamma[1]);
            let gain_b = encode_gain(ratio_b, metadata.gain_map_min[2], metadata.gain_map_max[2], metadata.gamma[2]);

            // For a single-channel gain map, use luminance-weighted average
            // Using BT.709 weights
            let gain = 0.2126 * gain_r + 0.7152 * gain_g + 0.0722 * gain_b;

            let gm_idx = (gy * gm_width + gx) as usize;
            gain_map[gm_idx] = (gain * 255.0).clamp(0.0, 255.0) as u8;
        }
    }

    Ok((gain_map, metadata))
}

/// Computes a per-channel RGB gain map for higher quality.
///
/// Returns a gain map with 3 bytes per pixel (RGB).
pub fn compute_gain_map_rgb(
    sdr_rgb: &[u8],
    hdr_linear: &[f32],
    width: u32,
    height: u32,
    target_capacity: f32,
    gain_map_scale: u8,
) -> Result<(Vec<u8>, GainMapMetadata)> {
    let pixel_count = (width * height) as usize;

    if sdr_rgb.len() != pixel_count * 3 {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "SDR buffer size {} doesn't match {}x{}x3",
            sdr_rgb.len(), width, height
        )));
    }
    if hdr_linear.len() != pixel_count * 3 {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "HDR buffer size {} doesn't match {}x{}x3",
            hdr_linear.len(), width, height
        )));
    }

    let scale = gain_map_scale.max(1) as u32;
    let gm_width = (width + scale - 1) / scale;
    let gm_height = (height + scale - 1) / scale;
    let gm_pixel_count = (gm_width * gm_height) as usize;

    let mut metadata_computer = MetadataComputer::new();
    let offset = 1.0 / 64.0;

    // Statistics pass
    let sample_step = ((width * height) / 10000).max(1) as usize;
    for i in (0..pixel_count).step_by(sample_step) {
        let sdr_r = sdr_rgb[i * 3] as f32 / 255.0;
        let sdr_g = sdr_rgb[i * 3 + 1] as f32 / 255.0;
        let sdr_b = sdr_rgb[i * 3 + 2] as f32 / 255.0;
        let (sdr_lin_r, sdr_lin_g, sdr_lin_b) = srgb_to_linear(sdr_r, sdr_g, sdr_b);

        metadata_computer.add_sample(
            [sdr_lin_r, sdr_lin_g, sdr_lin_b],
            [hdr_linear[i * 3], hdr_linear[i * 3 + 1], hdr_linear[i * 3 + 2]],
            offset,
            offset,
        );
    }

    let metadata = metadata_computer.compute(target_capacity);

    // Compute RGB gain map
    let mut gain_map = vec![0u8; gm_pixel_count * 3];

    for gy in 0..gm_height {
        for gx in 0..gm_width {
            let sx = ((gx * scale + scale / 2).min(width - 1)) as usize;
            let sy = ((gy * scale + scale / 2).min(height - 1)) as usize;
            let src_idx = sy * width as usize + sx;

            let sdr_r = sdr_rgb[src_idx * 3] as f32 / 255.0;
            let sdr_g = sdr_rgb[src_idx * 3 + 1] as f32 / 255.0;
            let sdr_b = sdr_rgb[src_idx * 3 + 2] as f32 / 255.0;
            let (sdr_lin_r, sdr_lin_g, sdr_lin_b) = srgb_to_linear(sdr_r, sdr_g, sdr_b);

            let hdr_r = hdr_linear[src_idx * 3];
            let hdr_g = hdr_linear[src_idx * 3 + 1];
            let hdr_b = hdr_linear[src_idx * 3 + 2];

            let ratio_r = compute_gain_ratio(sdr_lin_r, hdr_r, offset, offset);
            let ratio_g = compute_gain_ratio(sdr_lin_g, hdr_g, offset, offset);
            let ratio_b = compute_gain_ratio(sdr_lin_b, hdr_b, offset, offset);

            let gain_r = encode_gain(ratio_r, metadata.gain_map_min[0], metadata.gain_map_max[0], metadata.gamma[0]);
            let gain_g = encode_gain(ratio_g, metadata.gain_map_min[1], metadata.gain_map_max[1], metadata.gamma[1]);
            let gain_b = encode_gain(ratio_b, metadata.gain_map_min[2], metadata.gain_map_max[2], metadata.gamma[2]);

            let gm_idx = (gy * gm_width + gx) as usize;
            gain_map[gm_idx * 3] = (gain_r * 255.0).clamp(0.0, 255.0) as u8;
            gain_map[gm_idx * 3 + 1] = (gain_g * 255.0).clamp(0.0, 255.0) as u8;
            gain_map[gm_idx * 3 + 2] = (gain_b * 255.0).clamp(0.0, 255.0) as u8;
        }
    }

    Ok((gain_map, metadata))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_gain_map_basic() {
        // Create a simple 2x2 test image
        let width = 2u32;
        let height = 2u32;

        // SDR image (mid-gray)
        let sdr = vec![128u8; 12]; // 2x2x3

        // HDR image (brighter)
        let hdr = vec![0.5f32; 12]; // 2x2x3, linear

        let result = compute_gain_map(&sdr, &hdr, width, height, 3.0, 1);
        assert!(result.is_ok());

        let (gain_map, metadata) = result.unwrap();
        assert_eq!(gain_map.len(), 4); // 2x2 grayscale
        assert_eq!(metadata.version, "1.0");
    }

    #[test]
    fn test_compute_gain_map_invalid_size() {
        let sdr = vec![128u8; 12];
        let hdr = vec![0.5f32; 6]; // Wrong size

        let result = compute_gain_map(&sdr, &hdr, 2, 2, 3.0, 1);
        assert!(result.is_err());
    }

    #[test]
    fn test_compute_gain_map_with_scale() {
        let width = 4u32;
        let height = 4u32;

        let sdr = vec![128u8; 48]; // 4x4x3
        let hdr = vec![0.5f32; 48]; // 4x4x3

        // Scale factor 2 should give 2x2 gain map
        let (gain_map, _) = compute_gain_map(&sdr, &hdr, width, height, 3.0, 2).unwrap();
        assert_eq!(gain_map.len(), 4); // 2x2
    }
}
