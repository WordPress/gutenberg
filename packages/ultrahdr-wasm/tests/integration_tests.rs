//! Integration tests for UltraHDR WASM library.
//!
//! These tests verify the complete encode/decode workflow.

use wordpress_ultrahdr::*;

/// Test that encoding options can be created and validated.
#[test]
fn test_encode_options() {
    let default_opts = UltraHdrEncodeOptions::new();
    assert_eq!(default_opts.base_quality, 85);
    assert_eq!(default_opts.gain_map_quality, 75);
    assert_eq!(default_opts.target_hdr_capacity, 3.0);
    assert!(default_opts.include_iso_metadata);
    assert!(default_opts.include_ultrahdr_v1);

    let hq_opts = UltraHdrEncodeOptions::high_quality();
    assert_eq!(hq_opts.base_quality, 95);
    assert_eq!(hq_opts.target_hdr_capacity, 4.0);

    let small_opts = UltraHdrEncodeOptions::small_size();
    assert_eq!(small_opts.gain_map_scale, 2);
}

/// Test that default metadata can be created and validated.
#[test]
fn test_default_metadata() {
    let metadata = GainMapMetadata::new();
    assert_eq!(metadata.version, "1.0");
    assert!(!metadata.base_rendition_is_hdr);
    assert_eq!(metadata.gain_map_min.len(), 3);
    assert_eq!(metadata.gain_map_max.len(), 3);
    assert_eq!(metadata.gamma.len(), 3);
    assert_eq!(metadata.offset_sdr.len(), 3);
    assert_eq!(metadata.offset_hdr.len(), 3);

    assert!(gainmap::metadata::validate_metadata(&metadata).is_ok());
}

/// Test SDR base metadata creation.
#[test]
fn test_sdr_base_metadata() {
    let metadata = GainMapMetadata::for_sdr_base(4.0);
    assert!(!metadata.base_rendition_is_hdr);
    assert_eq!(metadata.hdr_capacity_max, 4.0);
    assert_eq!(metadata.gain_map_max, vec![4.0, 4.0, 4.0]);
}

/// Test metadata validation catches errors.
#[test]
fn test_metadata_validation() {
    // Valid metadata should pass
    let valid = GainMapMetadata::default();
    assert!(gainmap::metadata::validate_metadata(&valid).is_ok());

    // Invalid channel count
    let mut invalid = GainMapMetadata::default();
    invalid.gain_map_min = vec![0.0, 0.0]; // Only 2 values
    assert!(gainmap::metadata::validate_metadata(&invalid).is_err());

    // Invalid gain range (min > max)
    let mut invalid = GainMapMetadata::default();
    invalid.gain_map_min = vec![5.0, 5.0, 5.0];
    invalid.gain_map_max = vec![3.0, 3.0, 3.0];
    assert!(gainmap::metadata::validate_metadata(&invalid).is_err());

    // Invalid gamma (negative)
    let mut invalid = GainMapMetadata::default();
    invalid.gamma = vec![1.0, -1.0, 1.0];
    assert!(gainmap::metadata::validate_metadata(&invalid).is_err());
}

/// Test HDR headroom estimation.
#[test]
fn test_hdr_headroom_estimation() {
    let metadata = GainMapMetadata {
        gain_map_max: vec![3.0, 3.0, 3.0],
        ..Default::default()
    };
    assert_eq!(gainmap::metadata::estimate_hdr_headroom(&metadata), 3.0);

    let low_hdr = GainMapMetadata {
        gain_map_max: vec![0.2, 0.2, 0.2],
        ..Default::default()
    };
    assert!(!gainmap::metadata::is_meaningful_hdr(&low_hdr));

    let high_hdr = GainMapMetadata {
        gain_map_max: vec![3.0, 3.0, 3.0],
        ..Default::default()
    };
    assert!(gainmap::metadata::is_meaningful_hdr(&high_hdr));
}

/// Test color space math roundtrips.
mod color_math_tests {
    use wordpress_ultrahdr::gainmap::math::*;

    const TOLERANCE: f32 = 1e-5;

    fn approx_eq(a: f32, b: f32) -> bool {
        (a - b).abs() < TOLERANCE
    }

    #[test]
    fn test_srgb_roundtrip() {
        for i in 0..=10 {
            let linear = i as f32 / 10.0;
            let srgb = srgb_oetf(linear);
            let back = srgb_inverse_oetf(srgb);
            assert!(approx_eq(linear, back), "sRGB roundtrip failed at {}", linear);
        }
    }

    #[test]
    fn test_pq_roundtrip() {
        // PQ uses complex power functions with large exponents, so allow slightly larger tolerance
        const PQ_TOLERANCE: f32 = 1e-4;
        for i in 0..=10 {
            let linear = i as f32 / 10.0;
            let pq = pq_oetf(linear);
            let back = pq_inverse_oetf(pq);
            assert!((linear - back).abs() < PQ_TOLERANCE, "PQ roundtrip failed at {}", linear);
        }
    }

    #[test]
    fn test_hlg_roundtrip() {
        for i in 0..=10 {
            let linear = i as f32 / 10.0;
            let hlg = hlg_oetf(linear);
            let back = hlg_inverse_oetf(hlg);
            assert!(approx_eq(linear, back), "HLG roundtrip failed at {}", linear);
        }
    }

    #[test]
    fn test_luminance_values() {
        // Black should have 0 luminance
        assert_eq!(luminance_bt709(0.0, 0.0, 0.0), 0.0);

        // White should have ~1.0 luminance
        let white_luma = luminance_bt709(1.0, 1.0, 1.0);
        assert!(approx_eq(white_luma, 1.0));

        // Red, green, blue should sum to 1.0
        let r_luma = luminance_bt709(1.0, 0.0, 0.0);
        let g_luma = luminance_bt709(0.0, 1.0, 0.0);
        let b_luma = luminance_bt709(0.0, 0.0, 1.0);
        assert!(approx_eq(r_luma + g_luma + b_luma, 1.0));
    }

    #[test]
    fn test_gain_encode_decode() {
        let ratios = [0.5, 1.0, 2.0, 4.0, 8.0];
        let min_gain = -1.0;
        let max_gain = 3.0;
        let gamma = 1.0;

        for &ratio in &ratios {
            let encoded = encode_gain(ratio, min_gain, max_gain, gamma);
            let decoded = decode_gain(encoded, min_gain, max_gain, gamma);
            assert!(approx_eq(ratio, decoded), "Gain roundtrip failed at {}", ratio);
        }
    }

    #[test]
    fn test_hdr_weight() {
        // Full SDR
        assert_eq!(compute_hdr_weight(0.0, 0.0, 3.0), 0.0);
        // Full HDR
        assert_eq!(compute_hdr_weight(3.0, 0.0, 3.0), 1.0);
        // Mid point
        assert!(approx_eq(compute_hdr_weight(1.5, 0.0, 3.0), 0.5));
    }
}

/// Test XMP parsing and writing.
mod xmp_tests {
    use wordpress_ultrahdr::jpeg::xmp::{XmpParser, XmpWriter};
    use wordpress_ultrahdr::GainMapMetadata;

    #[test]
    fn test_xmp_roundtrip() {
        let original = GainMapMetadata {
            version: "1.0".to_string(),
            base_rendition_is_hdr: false,
            gain_map_min: vec![-1.0, -1.0, -1.0],
            gain_map_max: vec![3.0, 3.0, 3.0],
            gamma: vec![1.0, 1.0, 1.0],
            offset_sdr: vec![0.015625, 0.015625, 0.015625],
            offset_hdr: vec![0.015625, 0.015625, 0.015625],
            hdr_capacity_min: 1.0,
            hdr_capacity_max: 4.0,
        };

        let xmp = XmpWriter::create_iso_xmp(&original).unwrap();
        let parsed = XmpParser::parse(&xmp).unwrap();

        assert_eq!(original.version, parsed.version);
        assert_eq!(original.base_rendition_is_hdr, parsed.base_rendition_is_hdr);
        assert_eq!(original.hdr_capacity_max, parsed.hdr_capacity_max);
    }

    #[test]
    fn test_has_gain_map_metadata() {
        let xmp_with = b"<x:xmpmeta xmlns:hdrgm=\"http://ns.adobe.com/hdr-gain-map/1.0/\"></x:xmpmeta>";
        let xmp_without = b"<x:xmpmeta></x:xmpmeta>";

        assert!(XmpParser::has_gain_map_metadata(xmp_with));
        assert!(!XmpParser::has_gain_map_metadata(xmp_without));
    }
}

/// Test JPEG parsing.
mod jpeg_tests {
    use wordpress_ultrahdr::jpeg::parser::{JpegParser, MarkerType};

    #[test]
    fn test_minimal_jpeg() {
        let jpeg = vec![0xFF, 0xD8, 0xFF, 0xD9];
        let parser = JpegParser::parse(&jpeg).unwrap();
        assert_eq!(parser.segments().len(), 2);
        assert_eq!(parser.segments()[0].marker, MarkerType::Soi);
        assert_eq!(parser.segments()[1].marker, MarkerType::Eoi);
    }

    #[test]
    fn test_invalid_jpeg() {
        let not_jpeg = vec![0x89, 0x50, 0x4E, 0x47]; // PNG magic
        assert!(JpegParser::parse(&not_jpeg).is_err());
    }

    #[test]
    fn test_marker_type_conversion() {
        assert_eq!(MarkerType::from_byte(0xD8), MarkerType::Soi);
        assert_eq!(MarkerType::from_byte(0xD9), MarkerType::Eoi);
        assert_eq!(MarkerType::from_byte(0xE1), MarkerType::App1);
        assert_eq!(MarkerType::from_byte(0xE2), MarkerType::App2);
        assert_eq!(MarkerType::App1.to_byte(), 0xE1);
    }
}

/// Test UltraHDR detection.
mod detection_tests {
    use wordpress_ultrahdr::ultrahdr;

    #[test]
    fn test_non_jpeg_detection() {
        assert!(!ultrahdr::has_gainmap_metadata(&[]));
        assert!(!ultrahdr::has_gainmap_metadata(&[0x89, 0x50, 0x4E, 0x47])); // PNG
        assert!(!ultrahdr::has_gainmap_metadata(&[0xFF])); // Truncated
    }

    #[test]
    fn test_regular_jpeg_detection() {
        let minimal_jpeg = vec![0xFF, 0xD8, 0xFF, 0xD9];
        assert!(!ultrahdr::has_gainmap_metadata(&minimal_jpeg));
    }
}

/// Test gain map computation.
mod gainmap_tests {
    use wordpress_ultrahdr::gainmap::encode::compute_gain_map;

    #[test]
    fn test_compute_gain_map_basic() {
        let width = 4u32;
        let height = 4u32;

        // Mid-gray SDR image
        let sdr = vec![128u8; (width * height * 3) as usize];

        // Slightly brighter HDR image (linear)
        let hdr = vec![0.3f32; (width * height * 3) as usize];

        let result = compute_gain_map(&sdr, &hdr, width, height, 3.0, 1);
        assert!(result.is_ok());

        let (gain_map, metadata) = result.unwrap();
        assert_eq!(gain_map.len(), (width * height) as usize);
        assert_eq!(metadata.version, "1.0");
        assert!(!metadata.base_rendition_is_hdr);
    }

    #[test]
    fn test_compute_gain_map_with_scale() {
        let width = 8u32;
        let height = 8u32;

        let sdr = vec![128u8; (width * height * 3) as usize];
        let hdr = vec![0.3f32; (width * height * 3) as usize];

        // Scale factor 2 should give 4x4 gain map
        let (gain_map, _) = compute_gain_map(&sdr, &hdr, width, height, 3.0, 2).unwrap();
        assert_eq!(gain_map.len(), 16); // 4x4
    }

    #[test]
    fn test_compute_gain_map_invalid_size() {
        let sdr = vec![128u8; 12]; // 2x2x3
        let hdr = vec![0.3f32; 6]; // Wrong size

        let result = compute_gain_map(&sdr, &hdr, 2, 2, 3.0, 1);
        assert!(result.is_err());
    }
}

/// Test gain map application.
mod gainmap_apply_tests {
    use wordpress_ultrahdr::gainmap::decode::apply_gain_map;
    use wordpress_ultrahdr::GainMapMetadata;

    #[test]
    fn test_apply_gain_map_basic() {
        let width = 2u32;
        let height = 2u32;

        // Mid-gray SDR image
        let sdr = vec![128u8; 12];

        // Neutral gain map (128 = ~1.0x gain)
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
}
