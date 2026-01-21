//! Color space and transfer function math for gain map processing.
//!
//! Implements color space conversions and transfer functions according to
//! ISO 21496-1 and related standards (BT.709, BT.2100, Display P3).

use crate::types::{ColorGamut, TransferFunction};

/// Small epsilon value to avoid division by zero.
pub const EPSILON: f32 = 1e-6;

/// sRGB transfer function threshold.
const SRGB_THRESHOLD: f32 = 0.04045;
const SRGB_LINEAR_SCALE: f32 = 12.92;
const SRGB_GAMMA: f32 = 2.4;
const SRGB_A: f32 = 0.055;

/// BT.2100 PQ constants.
const PQ_M1: f32 = 0.1593017578125; // 2610/16384
const PQ_M2: f32 = 78.84375; // 2523/32 * 128
const PQ_C1: f32 = 0.8359375; // 3424/4096
const PQ_C2: f32 = 18.8515625; // 2413/128 * 32
const PQ_C3: f32 = 18.6875; // 2392/128 * 32

/// HLG constants.
const HLG_A: f32 = 0.17883277;
const HLG_B: f32 = 0.28466892; // 1 - 4*a
const HLG_C: f32 = 0.55991073; // 0.5 - a * ln(4*a)

/// Reference white luminance in nits for SDR.
pub const SDR_WHITE_NITS: f32 = 203.0;

/// Maximum luminance for PQ in nits.
pub const PQ_MAX_NITS: f32 = 10000.0;

// ============================================================================
// sRGB Transfer Functions
// ============================================================================

/// Applies the sRGB OETF (Opto-Electronic Transfer Function) - linear to sRGB.
#[inline]
pub fn srgb_oetf(linear: f32) -> f32 {
    if linear <= 0.0031308 {
        linear * SRGB_LINEAR_SCALE
    } else {
        (1.0 + SRGB_A) * linear.powf(1.0 / SRGB_GAMMA) - SRGB_A
    }
}

/// Applies the inverse sRGB OETF (sRGB to linear).
#[inline]
pub fn srgb_inverse_oetf(srgb: f32) -> f32 {
    if srgb <= SRGB_THRESHOLD {
        srgb / SRGB_LINEAR_SCALE
    } else {
        ((srgb + SRGB_A) / (1.0 + SRGB_A)).powf(SRGB_GAMMA)
    }
}

/// Converts sRGB color to linear RGB.
#[inline]
pub fn srgb_to_linear(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    (
        srgb_inverse_oetf(r),
        srgb_inverse_oetf(g),
        srgb_inverse_oetf(b),
    )
}

/// Converts linear RGB to sRGB.
#[inline]
pub fn linear_to_srgb(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    (
        srgb_oetf(r),
        srgb_oetf(g),
        srgb_oetf(b),
    )
}

// ============================================================================
// BT.2100 PQ Transfer Functions
// ============================================================================

/// Applies the PQ OETF (Perceptual Quantizer) - linear to PQ.
/// Input is expected to be in the range [0, 1] representing [0, 10000] nits.
#[inline]
pub fn pq_oetf(linear: f32) -> f32 {
    let y = linear.max(0.0);
    let y_m1 = y.powf(PQ_M1);
    let numerator = PQ_C1 + PQ_C2 * y_m1;
    let denominator = 1.0 + PQ_C3 * y_m1;
    (numerator / denominator).powf(PQ_M2)
}

/// Applies the inverse PQ OETF (PQ to linear).
/// Output is in the range [0, 1] representing [0, 10000] nits.
#[inline]
pub fn pq_inverse_oetf(pq: f32) -> f32 {
    let pq_clamped = pq.max(0.0).min(1.0);
    let pq_m2_inv = pq_clamped.powf(1.0 / PQ_M2);
    let numerator = (pq_m2_inv - PQ_C1).max(0.0);
    let denominator = PQ_C2 - PQ_C3 * pq_m2_inv;
    if denominator <= 0.0 {
        0.0
    } else {
        (numerator / denominator).powf(1.0 / PQ_M1)
    }
}

/// Converts PQ-encoded value to nits.
#[inline]
pub fn pq_to_nits(pq: f32) -> f32 {
    pq_inverse_oetf(pq) * PQ_MAX_NITS
}

/// Converts nits to PQ-encoded value.
#[inline]
pub fn nits_to_pq(nits: f32) -> f32 {
    pq_oetf(nits / PQ_MAX_NITS)
}

// ============================================================================
// BT.2100 HLG Transfer Functions
// ============================================================================

/// Applies the HLG OETF (Hybrid Log-Gamma) - linear to HLG.
/// Input is expected to be scene-referred linear light.
#[inline]
pub fn hlg_oetf(linear: f32) -> f32 {
    let e = linear.max(0.0);
    if e <= 1.0 / 12.0 {
        (3.0 * e).sqrt()
    } else {
        HLG_A * (12.0 * e - HLG_B).ln() + HLG_C
    }
}

/// Applies the inverse HLG OETF (HLG to linear).
#[inline]
pub fn hlg_inverse_oetf(hlg: f32) -> f32 {
    let hlg_clamped = hlg.max(0.0).min(1.0);
    if hlg_clamped <= 0.5 {
        hlg_clamped * hlg_clamped / 3.0
    } else {
        (((hlg_clamped - HLG_C) / HLG_A).exp() + HLG_B) / 12.0
    }
}

// ============================================================================
// Luminance Calculations
// ============================================================================

/// BT.709 luminance coefficients (also used for sRGB).
pub const LUMA_R_BT709: f32 = 0.2126;
pub const LUMA_G_BT709: f32 = 0.7152;
pub const LUMA_B_BT709: f32 = 0.0722;

/// BT.2020 luminance coefficients.
pub const LUMA_R_BT2020: f32 = 0.2627;
pub const LUMA_G_BT2020: f32 = 0.6780;
pub const LUMA_B_BT2020: f32 = 0.0593;

/// Display P3 luminance coefficients (same primaries as DCI-P3 but D65 white).
pub const LUMA_R_P3: f32 = 0.2289;
pub const LUMA_G_P3: f32 = 0.6917;
pub const LUMA_B_P3: f32 = 0.0793;

/// Calculates luminance from linear RGB using BT.709 coefficients.
#[inline]
pub fn luminance_bt709(r: f32, g: f32, b: f32) -> f32 {
    LUMA_R_BT709 * r + LUMA_G_BT709 * g + LUMA_B_BT709 * b
}

/// Calculates luminance from linear RGB using BT.2020 coefficients.
#[inline]
pub fn luminance_bt2020(r: f32, g: f32, b: f32) -> f32 {
    LUMA_R_BT2020 * r + LUMA_G_BT2020 * g + LUMA_B_BT2020 * b
}

/// Calculates luminance from linear RGB using Display P3 coefficients.
#[inline]
pub fn luminance_p3(r: f32, g: f32, b: f32) -> f32 {
    LUMA_R_P3 * r + LUMA_G_P3 * g + LUMA_B_P3 * b
}

/// Calculates luminance based on color gamut.
#[inline]
pub fn luminance(r: f32, g: f32, b: f32, gamut: ColorGamut) -> f32 {
    match gamut {
        ColorGamut::Srgb => luminance_bt709(r, g, b),
        ColorGamut::DisplayP3 => luminance_p3(r, g, b),
        ColorGamut::Bt2100 => luminance_bt2020(r, g, b),
    }
}

// ============================================================================
// Color Space Conversions
// ============================================================================

/// sRGB to XYZ matrix (D65 illuminant).
#[rustfmt::skip]
pub const SRGB_TO_XYZ: [[f32; 3]; 3] = [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041],
];

/// XYZ to sRGB matrix (D65 illuminant).
#[rustfmt::skip]
pub const XYZ_TO_SRGB: [[f32; 3]; 3] = [
    [ 3.2404542, -1.5371385, -0.4985314],
    [-0.9692660,  1.8760108,  0.0415560],
    [ 0.0556434, -0.2040259,  1.0572252],
];

/// Display P3 to XYZ matrix (D65 illuminant).
#[rustfmt::skip]
pub const P3_TO_XYZ: [[f32; 3]; 3] = [
    [0.4865709, 0.2656677, 0.1982173],
    [0.2289746, 0.6917385, 0.0792869],
    [0.0000000, 0.0451134, 1.0439444],
];

/// XYZ to Display P3 matrix (D65 illuminant).
#[rustfmt::skip]
pub const XYZ_TO_P3: [[f32; 3]; 3] = [
    [ 2.4934969, -0.9313836, -0.4027108],
    [-0.8294890,  1.7626641,  0.0236247],
    [ 0.0358458, -0.0761724,  0.9568845],
];

/// BT.2020 to XYZ matrix (D65 illuminant).
#[rustfmt::skip]
pub const BT2020_TO_XYZ: [[f32; 3]; 3] = [
    [0.6369580, 0.1446169, 0.1688810],
    [0.2627002, 0.6779981, 0.0593017],
    [0.0000000, 0.0280727, 1.0609851],
];

/// XYZ to BT.2020 matrix (D65 illuminant).
#[rustfmt::skip]
pub const XYZ_TO_BT2020: [[f32; 3]; 3] = [
    [ 1.7166512, -0.3556708, -0.2533663],
    [-0.6666844,  1.6164812,  0.0157685],
    [ 0.0176399, -0.0427706,  0.9421031],
];

/// Applies a 3x3 color matrix to RGB values.
#[inline]
pub fn apply_matrix(r: f32, g: f32, b: f32, matrix: &[[f32; 3]; 3]) -> (f32, f32, f32) {
    (
        matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b,
        matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b,
        matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b,
    )
}

/// Converts sRGB to Display P3 (both in linear space).
pub fn srgb_to_p3(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let xyz = apply_matrix(r, g, b, &SRGB_TO_XYZ);
    apply_matrix(xyz.0, xyz.1, xyz.2, &XYZ_TO_P3)
}

/// Converts Display P3 to sRGB (both in linear space).
pub fn p3_to_srgb(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let xyz = apply_matrix(r, g, b, &P3_TO_XYZ);
    apply_matrix(xyz.0, xyz.1, xyz.2, &XYZ_TO_SRGB)
}

/// Converts sRGB to BT.2020 (both in linear space).
pub fn srgb_to_bt2020(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let xyz = apply_matrix(r, g, b, &SRGB_TO_XYZ);
    apply_matrix(xyz.0, xyz.1, xyz.2, &XYZ_TO_BT2020)
}

/// Converts BT.2020 to sRGB (both in linear space).
pub fn bt2020_to_srgb(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let xyz = apply_matrix(r, g, b, &BT2020_TO_XYZ);
    apply_matrix(xyz.0, xyz.1, xyz.2, &XYZ_TO_SRGB)
}

// ============================================================================
// Transfer Function Application
// ============================================================================

/// Applies a transfer function to linear RGB values.
pub fn apply_transfer_function(r: f32, g: f32, b: f32, tf: TransferFunction) -> (f32, f32, f32) {
    match tf {
        TransferFunction::Srgb => linear_to_srgb(r, g, b),
        TransferFunction::Linear => (r, g, b),
        TransferFunction::Pq => (pq_oetf(r), pq_oetf(g), pq_oetf(b)),
        TransferFunction::Hlg => (hlg_oetf(r), hlg_oetf(g), hlg_oetf(b)),
    }
}

/// Applies inverse transfer function to get linear RGB.
pub fn inverse_transfer_function(r: f32, g: f32, b: f32, tf: TransferFunction) -> (f32, f32, f32) {
    match tf {
        TransferFunction::Srgb => srgb_to_linear(r, g, b),
        TransferFunction::Linear => (r, g, b),
        TransferFunction::Pq => (pq_inverse_oetf(r), pq_inverse_oetf(g), pq_inverse_oetf(b)),
        TransferFunction::Hlg => (hlg_inverse_oetf(r), hlg_inverse_oetf(g), hlg_inverse_oetf(b)),
    }
}

// ============================================================================
// Gain Map Specific Math
// ============================================================================

/// Encodes a gain value to the [0, 1] range using the gain map formula.
///
/// gain_encoded = ((log2(ratio) - min_log2) / (max_log2 - min_log2)) ^ (1/gamma)
#[inline]
pub fn encode_gain(ratio: f32, min_gain: f32, max_gain: f32, gamma: f32) -> f32 {
    let log_ratio = ratio.max(EPSILON).log2();
    let normalized = (log_ratio - min_gain) / (max_gain - min_gain).max(EPSILON);
    normalized.clamp(0.0, 1.0).powf(1.0 / gamma)
}

/// Decodes a gain value from the [0, 1] range.
///
/// ratio = 2 ^ (gain_decoded ^ gamma * (max_log2 - min_log2) + min_log2)
#[inline]
pub fn decode_gain(encoded: f32, min_gain: f32, max_gain: f32, gamma: f32) -> f32 {
    let degamma = encoded.powf(gamma);
    let log_ratio = degamma * (max_gain - min_gain) + min_gain;
    2.0_f32.powf(log_ratio)
}

/// Applies gain to a pixel value with offset adjustment.
///
/// output = (input + offset_sdr) * gain - offset_hdr
#[inline]
pub fn apply_gain_to_pixel(input: f32, gain: f32, offset_sdr: f32, offset_hdr: f32) -> f32 {
    ((input + offset_sdr) * gain - offset_hdr).max(0.0)
}

/// Computes the gain ratio between HDR and SDR pixel values.
///
/// ratio = (hdr + offset_hdr) / (sdr + offset_sdr)
#[inline]
pub fn compute_gain_ratio(sdr: f32, hdr: f32, offset_sdr: f32, offset_hdr: f32) -> f32 {
    (hdr + offset_hdr) / (sdr + offset_sdr).max(EPSILON)
}

/// Interpolates between SDR and HDR based on display HDR capacity.
///
/// weight = clamp((display_capacity - capacity_min) / (capacity_max - capacity_min), 0, 1)
#[inline]
pub fn compute_hdr_weight(display_capacity: f32, capacity_min: f32, capacity_max: f32) -> f32 {
    if capacity_max <= capacity_min {
        return 1.0;
    }
    ((display_capacity - capacity_min) / (capacity_max - capacity_min)).clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOLERANCE: f32 = 1e-5;

    fn approx_eq(a: f32, b: f32) -> bool {
        (a - b).abs() < TOLERANCE
    }

    #[test]
    fn test_srgb_roundtrip() {
        for i in 0..=100 {
            let linear = i as f32 / 100.0;
            let srgb = srgb_oetf(linear);
            let back = srgb_inverse_oetf(srgb);
            assert!(approx_eq(linear, back), "Failed at {}: {} vs {}", linear, linear, back);
        }
    }

    #[test]
    fn test_pq_roundtrip() {
        // PQ uses complex power functions with large exponents, so allow slightly larger tolerance
        const PQ_TOLERANCE: f32 = 1e-4;
        for i in 0..=100 {
            let linear = i as f32 / 100.0;
            let pq = pq_oetf(linear);
            let back = pq_inverse_oetf(pq);
            assert!((linear - back).abs() < PQ_TOLERANCE, "Failed at {}: {} vs {}", linear, linear, back);
        }
    }

    #[test]
    fn test_hlg_roundtrip() {
        for i in 0..=100 {
            let linear = i as f32 / 100.0;
            let hlg = hlg_oetf(linear);
            let back = hlg_inverse_oetf(hlg);
            assert!(approx_eq(linear, back), "Failed at {}: {} vs {}", linear, linear, back);
        }
    }

    #[test]
    fn test_luminance_black() {
        assert_eq!(luminance_bt709(0.0, 0.0, 0.0), 0.0);
    }

    #[test]
    fn test_luminance_white() {
        let luma = luminance_bt709(1.0, 1.0, 1.0);
        assert!(approx_eq(luma, 1.0));
    }

    #[test]
    fn test_gain_encode_decode_roundtrip() {
        let ratios = [0.5, 1.0, 2.0, 4.0, 8.0];
        let min_gain = -1.0;
        let max_gain = 3.0;
        let gamma = 1.0;

        for &ratio in &ratios {
            let encoded = encode_gain(ratio, min_gain, max_gain, gamma);
            let decoded = decode_gain(encoded, min_gain, max_gain, gamma);
            assert!(approx_eq(ratio, decoded), "Failed at {}: {} vs {}", ratio, ratio, decoded);
        }
    }

    #[test]
    fn test_hdr_weight_calculation() {
        // Full SDR
        assert_eq!(compute_hdr_weight(0.0, 0.0, 3.0), 0.0);
        // Full HDR
        assert_eq!(compute_hdr_weight(3.0, 0.0, 3.0), 1.0);
        // Mid point
        assert!(approx_eq(compute_hdr_weight(1.5, 0.0, 3.0), 0.5));
    }
}
