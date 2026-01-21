//! UltraHDR JPEG encoder.
//!
//! Creates UltraHDR JPEG files from SDR + HDR image pairs.

use crate::error::{Result, UltraHdrError};
use crate::types::{GainMapMetadata, UltraHdrEncodeOptions};
use crate::gainmap::encode::compute_gain_map;
use crate::jpeg::parser::JpegParser;
use crate::jpeg::writer::JpegWriter;
use crate::jpeg::xmp::XmpWriter;
use image::{ImageBuffer, Luma};
use std::io::Cursor;

/// Encodes an UltraHDR JPEG from SDR and HDR image data.
///
/// # Arguments
/// * `sdr_jpeg` - SDR JPEG image bytes
/// * `hdr_linear` - HDR linear RGB data (3 floats per pixel, normalized to [0,1])
/// * `options` - Encoding options
///
/// # Returns
/// The encoded UltraHDR JPEG as bytes.
pub fn encode(
    sdr_jpeg: &[u8],
    hdr_linear: &[f32],
    options: &UltraHdrEncodeOptions,
) -> Result<Vec<u8>> {
    // Validate options
    validate_options(options)?;

    // Parse the SDR JPEG to get segments and dimensions
    let parser = JpegParser::parse(sdr_jpeg)?;
    let (width, height) = parser.get_dimensions()
        .ok_or_else(|| UltraHdrError::InvalidJpeg("Cannot determine image dimensions".to_string()))?;

    // Validate dimensions
    if width % 2 != 0 {
        return Err(UltraHdrError::InvalidDimensions(
            format!("Width must be even, got {}", width)
        ));
    }
    if height % 2 != 0 {
        return Err(UltraHdrError::InvalidDimensions(
            format!("Height must be even, got {}", height)
        ));
    }

    // Decode SDR JPEG to get raw RGB data
    let sdr_rgb = decode_jpeg_to_rgb(sdr_jpeg)?;
    let expected_size = (width * height * 3) as usize;
    if sdr_rgb.len() != expected_size {
        return Err(UltraHdrError::InvalidDimensions(format!(
            "SDR RGB size {} doesn't match dimensions {}x{}",
            sdr_rgb.len(), width, height
        )));
    }

    // Validate HDR data size
    if hdr_linear.len() != expected_size {
        return Err(UltraHdrError::DimensionMismatch(
            width, height,
            (hdr_linear.len() / 3) as u32 / height, height
        ));
    }

    // Compute gain map
    let (gain_map_data, metadata) = compute_gain_map(
        &sdr_rgb,
        hdr_linear,
        width,
        height,
        options.target_hdr_capacity,
        options.gain_map_scale,
    )?;

    // Calculate gain map dimensions
    let scale = options.gain_map_scale.max(1) as u32;
    let gm_width = (width + scale - 1) / scale;
    let gm_height = (height + scale - 1) / scale;

    // Encode gain map as JPEG
    let gain_map_jpeg = encode_gain_map_jpeg(&gain_map_data, gm_width, gm_height, options.gain_map_quality)?;

    // Create the final UltraHDR JPEG
    create_ultrahdr_jpeg(
        sdr_jpeg,
        &gain_map_jpeg,
        &metadata,
        options,
    )
}

/// Encodes an UltraHDR JPEG from already-computed components.
///
/// Useful when you have pre-computed gain map data.
pub fn encode_from_components(
    sdr_jpeg: &[u8],
    gain_map_jpeg: &[u8],
    metadata: &GainMapMetadata,
    options: &UltraHdrEncodeOptions,
) -> Result<Vec<u8>> {
    create_ultrahdr_jpeg(sdr_jpeg, gain_map_jpeg, metadata, options)
}

/// Validates encoding options.
fn validate_options(options: &UltraHdrEncodeOptions) -> Result<()> {
    if options.base_quality == 0 || options.base_quality > 100 {
        return Err(UltraHdrError::InvalidQuality(options.base_quality));
    }
    if options.gain_map_quality == 0 || options.gain_map_quality > 100 {
        return Err(UltraHdrError::InvalidQuality(options.gain_map_quality));
    }
    if options.target_hdr_capacity <= 0.0 {
        return Err(UltraHdrError::InvalidHdrCapacity(0.0, options.target_hdr_capacity));
    }
    Ok(())
}

/// Decodes a JPEG to raw RGB bytes.
fn decode_jpeg_to_rgb(jpeg_data: &[u8]) -> Result<Vec<u8>> {
    let img = image::load_from_memory_with_format(jpeg_data, image::ImageFormat::Jpeg)?;
    let rgb = img.to_rgb8();
    Ok(rgb.into_raw())
}

/// Encodes a grayscale gain map as JPEG.
fn encode_gain_map_jpeg(data: &[u8], width: u32, height: u32, quality: u8) -> Result<Vec<u8>> {
    let img: ImageBuffer<Luma<u8>, Vec<u8>> = ImageBuffer::from_raw(width, height, data.to_vec())
        .ok_or_else(|| UltraHdrError::EncodeError("Failed to create gain map image".to_string()))?;

    let mut output = Cursor::new(Vec::new());
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, quality);
    encoder.encode(
        img.as_raw(),
        width,
        height,
        image::ExtendedColorType::L8,
    )?;

    Ok(output.into_inner())
}

/// Creates the final UltraHDR JPEG by combining SDR base with gain map.
fn create_ultrahdr_jpeg(
    sdr_jpeg: &[u8],
    gain_map_jpeg: &[u8],
    metadata: &GainMapMetadata,
    options: &UltraHdrEncodeOptions,
) -> Result<Vec<u8>> {
    // Parse the SDR JPEG
    let parser = JpegParser::parse(sdr_jpeg)?;

    // Create writer with existing segments
    let mut writer = JpegWriter::new(
        parser.segments().to_vec(),
        parser.scan_data().to_vec(),
    );

    // Remove any existing XMP/MPF segments
    writer.remove_xmp_segments();
    writer.remove_mpf_segments();

    // Create and add XMP metadata
    let xmp_data = if options.include_ultrahdr_v1 {
        XmpWriter::create_combined_xmp(metadata)?
    } else if options.include_iso_metadata {
        XmpWriter::create_iso_xmp(metadata)?
    } else {
        return Err(UltraHdrError::MetadataError(
            "At least one metadata format must be enabled".to_string()
        ));
    };

    writer.add_xmp_segment(&xmp_data)?;

    // Write base JPEG first to calculate gain map offset
    let base_jpeg = writer.write()?;
    let gain_map_offset = base_jpeg.len() as u32;

    // Add MPF segment pointing to gain map
    // Need to re-parse and re-write with MPF included
    let parser2 = JpegParser::parse(&base_jpeg)?;
    let mut writer2 = JpegWriter::new(
        parser2.segments().to_vec(),
        parser2.scan_data().to_vec(),
    );

    // Recalculate offset after adding MPF (MPF segment is ~100 bytes)
    let estimated_mpf_size = 120;
    let final_gain_map_offset = gain_map_offset + estimated_mpf_size;

    writer2.add_mpf_segment(final_gain_map_offset, gain_map_jpeg.len() as u32)?;

    // Write final output with gain map appended
    writer2.write_with_gain_map(gain_map_jpeg)
}

/// Re-encodes an SDR JPEG with specified quality.
pub fn reencode_jpeg(jpeg_data: &[u8], quality: u8) -> Result<Vec<u8>> {
    let img = image::load_from_memory_with_format(jpeg_data, image::ImageFormat::Jpeg)?;
    let rgb = img.to_rgb8();

    let mut output = Cursor::new(Vec::new());
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, quality);
    encoder.encode(
        rgb.as_raw(),
        rgb.width(),
        rgb.height(),
        image::ExtendedColorType::Rgb8,
    )?;

    Ok(output.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_options_valid() {
        let options = UltraHdrEncodeOptions::default();
        assert!(validate_options(&options).is_ok());
    }

    #[test]
    fn test_validate_options_invalid_quality() {
        let mut options = UltraHdrEncodeOptions::default();
        options.base_quality = 0;
        assert!(validate_options(&options).is_err());

        options.base_quality = 101;
        assert!(validate_options(&options).is_err());
    }

    #[test]
    fn test_validate_options_invalid_capacity() {
        let mut options = UltraHdrEncodeOptions::default();
        options.target_hdr_capacity = -1.0;
        assert!(validate_options(&options).is_err());
    }

    #[test]
    fn test_encode_gain_map_jpeg() {
        // Create a simple 2x2 gain map
        let data = vec![0u8, 64, 128, 255];
        let result = encode_gain_map_jpeg(&data, 2, 2, 75);
        assert!(result.is_ok());

        let jpeg = result.unwrap();
        // Should be valid JPEG (starts with magic bytes)
        assert!(jpeg.len() >= 2);
        assert_eq!(jpeg[0], 0xFF);
        assert_eq!(jpeg[1], 0xD8);
    }
}
