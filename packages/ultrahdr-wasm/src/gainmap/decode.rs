//! Gain map decoding (application to reconstruct HDR).
//!
//! Implements the gain map application algorithm from ISO 21496-1.

use crate::error::{Result, UltraHdrError};
use crate::types::GainMapMetadata;
use super::math::{decode_gain, apply_gain_to_pixel, compute_hdr_weight, srgb_to_linear, linear_to_srgb};

/// Applies a gain map to an SDR image to produce an HDR result.
///
/// # Arguments
/// * `sdr_rgb` - SDR image as RGB bytes (sRGB encoded, 3 bytes per pixel)
/// * `gain_map` - Gain map as grayscale bytes (1 byte per pixel)
/// * `metadata` - Gain map metadata
/// * `width` - SDR image width
/// * `height` - SDR image height
/// * `gm_width` - Gain map width
/// * `gm_height` - Gain map height
/// * `display_hdr_capacity` - Display's HDR capacity (in stops)
///
/// # Returns
/// Linear HDR RGB image as floats (3 floats per pixel).
pub fn apply_gain_map(
    sdr_rgb: &[u8],
    gain_map: &[u8],
    metadata: &GainMapMetadata,
    width: u32,
    height: u32,
    gm_width: u32,
    gm_height: u32,
    display_hdr_capacity: f32,
) -> Result<Vec<f32>> {
    let pixel_count = (width * height) as usize;
    let gm_pixel_count = (gm_width * gm_height) as usize;

    // Validate input sizes
    if sdr_rgb.len() != pixel_count * 3 {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "SDR buffer size {} doesn't match {}x{}x3",
            sdr_rgb.len(), width, height
        )));
    }
    if gain_map.len() != gm_pixel_count {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "Gain map size {} doesn't match {}x{}",
            gain_map.len(), gm_width, gm_height
        )));
    }

    // Compute HDR weight based on display capability
    let hdr_weight = compute_hdr_weight(
        display_hdr_capacity,
        metadata.hdr_capacity_min,
        metadata.hdr_capacity_max,
    );

    let mut hdr_output = vec![0.0f32; pixel_count * 3];

    // Scale factors for gain map sampling
    let scale_x = gm_width as f32 / width as f32;
    let scale_y = gm_height as f32 / height as f32;

    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;

            // Get SDR pixel and convert to linear
            let sdr_r = sdr_rgb[idx * 3] as f32 / 255.0;
            let sdr_g = sdr_rgb[idx * 3 + 1] as f32 / 255.0;
            let sdr_b = sdr_rgb[idx * 3 + 2] as f32 / 255.0;
            let (sdr_lin_r, sdr_lin_g, sdr_lin_b) = srgb_to_linear(sdr_r, sdr_g, sdr_b);

            // Sample gain map with bilinear interpolation
            let gm_x = x as f32 * scale_x;
            let gm_y = y as f32 * scale_y;
            let gain_encoded = sample_gain_map_bilinear(gain_map, gm_width, gm_height, gm_x, gm_y);

            // Decode gain value (same for all channels in single-channel gain map)
            // Interpolate between min and max gain based on HDR weight
            let effective_min = interpolate_per_channel(&metadata.gain_map_min, hdr_weight);
            let effective_max = interpolate_per_channel(&metadata.gain_map_max, hdr_weight);

            let gain_r = decode_gain(gain_encoded, effective_min[0], effective_max[0], metadata.gamma[0]);
            let gain_g = decode_gain(gain_encoded, effective_min[1], effective_max[1], metadata.gamma[1]);
            let gain_b = decode_gain(gain_encoded, effective_min[2], effective_max[2], metadata.gamma[2]);

            // Apply gain to each channel
            let hdr_r = apply_gain_to_pixel(
                sdr_lin_r,
                gain_r,
                metadata.offset_sdr[0],
                metadata.offset_hdr[0],
            );
            let hdr_g = apply_gain_to_pixel(
                sdr_lin_g,
                gain_g,
                metadata.offset_sdr[1],
                metadata.offset_hdr[1],
            );
            let hdr_b = apply_gain_to_pixel(
                sdr_lin_b,
                gain_b,
                metadata.offset_sdr[2],
                metadata.offset_hdr[2],
            );

            hdr_output[idx * 3] = hdr_r;
            hdr_output[idx * 3 + 1] = hdr_g;
            hdr_output[idx * 3 + 2] = hdr_b;
        }
    }

    Ok(hdr_output)
}

/// Applies a per-channel RGB gain map to an SDR image.
pub fn apply_gain_map_rgb(
    sdr_rgb: &[u8],
    gain_map_rgb: &[u8],
    metadata: &GainMapMetadata,
    width: u32,
    height: u32,
    gm_width: u32,
    gm_height: u32,
    display_hdr_capacity: f32,
) -> Result<Vec<f32>> {
    let pixel_count = (width * height) as usize;
    let gm_pixel_count = (gm_width * gm_height) as usize;

    if sdr_rgb.len() != pixel_count * 3 {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "SDR buffer size {} doesn't match {}x{}x3",
            sdr_rgb.len(), width, height
        )));
    }
    if gain_map_rgb.len() != gm_pixel_count * 3 {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "RGB gain map size {} doesn't match {}x{}x3",
            gain_map_rgb.len(), gm_width, gm_height
        )));
    }

    let hdr_weight = compute_hdr_weight(
        display_hdr_capacity,
        metadata.hdr_capacity_min,
        metadata.hdr_capacity_max,
    );

    let mut hdr_output = vec![0.0f32; pixel_count * 3];

    let scale_x = gm_width as f32 / width as f32;
    let scale_y = gm_height as f32 / height as f32;

    for y in 0..height {
        for x in 0..width {
            let idx = (y * width + x) as usize;

            let sdr_r = sdr_rgb[idx * 3] as f32 / 255.0;
            let sdr_g = sdr_rgb[idx * 3 + 1] as f32 / 255.0;
            let sdr_b = sdr_rgb[idx * 3 + 2] as f32 / 255.0;
            let (sdr_lin_r, sdr_lin_g, sdr_lin_b) = srgb_to_linear(sdr_r, sdr_g, sdr_b);

            let gm_x = x as f32 * scale_x;
            let gm_y = y as f32 * scale_y;
            let (gain_enc_r, gain_enc_g, gain_enc_b) = sample_gain_map_rgb_bilinear(
                gain_map_rgb, gm_width, gm_height, gm_x, gm_y
            );

            let effective_min = interpolate_per_channel(&metadata.gain_map_min, hdr_weight);
            let effective_max = interpolate_per_channel(&metadata.gain_map_max, hdr_weight);

            let gain_r = decode_gain(gain_enc_r, effective_min[0], effective_max[0], metadata.gamma[0]);
            let gain_g = decode_gain(gain_enc_g, effective_min[1], effective_max[1], metadata.gamma[1]);
            let gain_b = decode_gain(gain_enc_b, effective_min[2], effective_max[2], metadata.gamma[2]);

            hdr_output[idx * 3] = apply_gain_to_pixel(sdr_lin_r, gain_r, metadata.offset_sdr[0], metadata.offset_hdr[0]);
            hdr_output[idx * 3 + 1] = apply_gain_to_pixel(sdr_lin_g, gain_g, metadata.offset_sdr[1], metadata.offset_hdr[1]);
            hdr_output[idx * 3 + 2] = apply_gain_to_pixel(sdr_lin_b, gain_b, metadata.offset_sdr[2], metadata.offset_hdr[2]);
        }
    }

    Ok(hdr_output)
}

/// Renders HDR output to sRGB for SDR displays.
///
/// Applies tone mapping to bring HDR values into displayable range.
pub fn render_to_srgb(hdr_linear: &[f32], max_luminance: f32) -> Vec<u8> {
    let pixel_count = hdr_linear.len() / 3;
    let mut output = vec![0u8; pixel_count * 3];

    for i in 0..pixel_count {
        // Simple Reinhard tone mapping
        let r = hdr_linear[i * 3];
        let g = hdr_linear[i * 3 + 1];
        let b = hdr_linear[i * 3 + 2];

        let mapped_r = r / (1.0 + r / max_luminance);
        let mapped_g = g / (1.0 + g / max_luminance);
        let mapped_b = b / (1.0 + b / max_luminance);

        let (srgb_r, srgb_g, srgb_b) = linear_to_srgb(mapped_r, mapped_g, mapped_b);

        output[i * 3] = (srgb_r * 255.0).clamp(0.0, 255.0) as u8;
        output[i * 3 + 1] = (srgb_g * 255.0).clamp(0.0, 255.0) as u8;
        output[i * 3 + 2] = (srgb_b * 255.0).clamp(0.0, 255.0) as u8;
    }

    output
}

/// Samples gain map with bilinear interpolation.
fn sample_gain_map_bilinear(gain_map: &[u8], width: u32, height: u32, x: f32, y: f32) -> f32 {
    let x0 = (x.floor() as u32).min(width - 1);
    let y0 = (y.floor() as u32).min(height - 1);
    let x1 = (x0 + 1).min(width - 1);
    let y1 = (y0 + 1).min(height - 1);

    let fx = x - x0 as f32;
    let fy = y - y0 as f32;

    let v00 = gain_map[(y0 * width + x0) as usize] as f32 / 255.0;
    let v10 = gain_map[(y0 * width + x1) as usize] as f32 / 255.0;
    let v01 = gain_map[(y1 * width + x0) as usize] as f32 / 255.0;
    let v11 = gain_map[(y1 * width + x1) as usize] as f32 / 255.0;

    let v0 = v00 * (1.0 - fx) + v10 * fx;
    let v1 = v01 * (1.0 - fx) + v11 * fx;

    v0 * (1.0 - fy) + v1 * fy
}

/// Samples RGB gain map with bilinear interpolation.
fn sample_gain_map_rgb_bilinear(
    gain_map: &[u8],
    width: u32,
    height: u32,
    x: f32,
    y: f32,
) -> (f32, f32, f32) {
    let x0 = (x.floor() as u32).min(width - 1);
    let y0 = (y.floor() as u32).min(height - 1);
    let x1 = (x0 + 1).min(width - 1);
    let y1 = (y0 + 1).min(height - 1);

    let fx = x - x0 as f32;
    let fy = y - y0 as f32;

    let idx00 = ((y0 * width + x0) * 3) as usize;
    let idx10 = ((y0 * width + x1) * 3) as usize;
    let idx01 = ((y1 * width + x0) * 3) as usize;
    let idx11 = ((y1 * width + x1) * 3) as usize;

    let mut result = [0.0f32; 3];

    for c in 0..3 {
        let v00 = gain_map[idx00 + c] as f32 / 255.0;
        let v10 = gain_map[idx10 + c] as f32 / 255.0;
        let v01 = gain_map[idx01 + c] as f32 / 255.0;
        let v11 = gain_map[idx11 + c] as f32 / 255.0;

        let v0 = v00 * (1.0 - fx) + v10 * fx;
        let v1 = v01 * (1.0 - fx) + v11 * fx;

        result[c] = v0 * (1.0 - fy) + v1 * fy;
    }

    (result[0], result[1], result[2])
}

/// Interpolates per-channel values based on HDR weight.
fn interpolate_per_channel(values: &[f32], weight: f32) -> Vec<f32> {
    // When weight = 0, use 0 (no HDR), when weight = 1, use full values
    values.iter().map(|&v| v * weight).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_apply_gain_map_basic() {
        let width = 2u32;
        let height = 2u32;

        // Mid-gray SDR image
        let sdr = vec![128u8; 12];

        // Neutral gain map (mid-point = no change)
        let gain_map = vec![128u8; 4];

        let metadata = GainMapMetadata::default();

        let result = apply_gain_map(
            &sdr, &gain_map, &metadata,
            width, height, width, height,
            3.0
        );

        assert!(result.is_ok());
        let hdr = result.unwrap();
        assert_eq!(hdr.len(), 12); // 2x2x3 floats
    }

    #[test]
    fn test_apply_gain_map_different_sizes() {
        let width = 4u32;
        let height = 4u32;
        let gm_width = 2u32;
        let gm_height = 2u32;

        let sdr = vec![128u8; 48]; // 4x4x3
        let gain_map = vec![128u8; 4]; // 2x2

        let metadata = GainMapMetadata::default();

        let result = apply_gain_map(
            &sdr, &gain_map, &metadata,
            width, height, gm_width, gm_height,
            3.0
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_render_to_srgb() {
        let hdr = vec![0.5f32, 0.5, 0.5, 1.0, 1.0, 1.0]; // 2 pixels
        let srgb = render_to_srgb(&hdr, 4.0);

        assert_eq!(srgb.len(), 6);
        // Verify we get valid u8 output (non-zero for these inputs)
        assert!(srgb.iter().any(|&v| v > 0));
    }

    #[test]
    fn test_bilinear_interpolation() {
        let gain_map = vec![0u8, 255, 0, 255]; // 2x2
        let center = sample_gain_map_bilinear(&gain_map, 2, 2, 0.5, 0.5);
        // Should be average of all 4 pixels
        assert!((center - 0.5).abs() < 0.01);
    }
}
