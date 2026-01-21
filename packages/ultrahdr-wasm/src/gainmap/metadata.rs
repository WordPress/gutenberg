//! Gain map metadata processing.
//!
//! Provides utilities for working with ISO 21496-1 gain map metadata.

use crate::error::{Result, UltraHdrError};
use crate::types::GainMapMetadata;

/// Validates gain map metadata for correctness.
pub fn validate_metadata(metadata: &GainMapMetadata) -> Result<()> {
    // Validate channel counts
    if metadata.gain_map_min.len() != 3 {
        return Err(UltraHdrError::MetadataError(
            format!("gain_map_min must have 3 values, got {}", metadata.gain_map_min.len())
        ));
    }
    if metadata.gain_map_max.len() != 3 {
        return Err(UltraHdrError::MetadataError(
            format!("gain_map_max must have 3 values, got {}", metadata.gain_map_max.len())
        ));
    }
    if metadata.gamma.len() != 3 {
        return Err(UltraHdrError::MetadataError(
            format!("gamma must have 3 values, got {}", metadata.gamma.len())
        ));
    }
    if metadata.offset_sdr.len() != 3 {
        return Err(UltraHdrError::MetadataError(
            format!("offset_sdr must have 3 values, got {}", metadata.offset_sdr.len())
        ));
    }
    if metadata.offset_hdr.len() != 3 {
        return Err(UltraHdrError::MetadataError(
            format!("offset_hdr must have 3 values, got {}", metadata.offset_hdr.len())
        ));
    }

    // Validate gain range
    for i in 0..3 {
        if metadata.gain_map_min[i] > metadata.gain_map_max[i] {
            return Err(UltraHdrError::MetadataError(
                format!("gain_map_min[{}] ({}) > gain_map_max[{}] ({})",
                    i, metadata.gain_map_min[i], i, metadata.gain_map_max[i])
            ));
        }
    }

    // Validate gamma (must be positive)
    for (i, &g) in metadata.gamma.iter().enumerate() {
        if g <= 0.0 {
            return Err(UltraHdrError::MetadataError(
                format!("gamma[{}] must be positive, got {}", i, g)
            ));
        }
    }

    // Validate HDR capacity range
    if metadata.hdr_capacity_min > metadata.hdr_capacity_max {
        return Err(UltraHdrError::InvalidHdrCapacity(
            metadata.hdr_capacity_min,
            metadata.hdr_capacity_max,
        ));
    }

    Ok(())
}

/// Computes optimal metadata parameters from SDR and HDR image statistics.
pub struct MetadataComputer {
    /// Accumulated minimum gain ratios per channel
    min_ratios: [f32; 3],
    /// Accumulated maximum gain ratios per channel
    max_ratios: [f32; 3],
    /// Sample count
    sample_count: usize,
}

impl MetadataComputer {
    /// Creates a new metadata computer.
    pub fn new() -> Self {
        Self {
            min_ratios: [f32::MAX, f32::MAX, f32::MAX],
            max_ratios: [f32::MIN, f32::MIN, f32::MIN],
            sample_count: 0,
        }
    }

    /// Adds a sample of SDR and HDR pixel values.
    pub fn add_sample(&mut self, sdr: [f32; 3], hdr: [f32; 3], offset_sdr: f32, offset_hdr: f32) {
        for i in 0..3 {
            let ratio = (hdr[i] + offset_hdr) / (sdr[i] + offset_sdr).max(super::math::EPSILON);
            if ratio > 0.0 && ratio.is_finite() {
                let log_ratio = ratio.log2();
                self.min_ratios[i] = self.min_ratios[i].min(log_ratio);
                self.max_ratios[i] = self.max_ratios[i].max(log_ratio);
            }
        }
        self.sample_count += 1;
    }

    /// Computes the final metadata from accumulated samples.
    pub fn compute(&self, target_capacity: f32) -> GainMapMetadata {
        let offset = 1.0 / 64.0; // Standard offset value

        // Compute gain range with some margin
        let mut min_gain = [0.0f32; 3];
        let mut max_gain = [target_capacity; 3];

        for i in 0..3 {
            if self.min_ratios[i] < f32::MAX {
                min_gain[i] = (self.min_ratios[i] - 0.1).max(-2.0);
            }
            if self.max_ratios[i] > f32::MIN {
                max_gain[i] = (self.max_ratios[i] + 0.1).min(target_capacity + 1.0);
            }
        }

        GainMapMetadata {
            version: "1.0".to_string(),
            base_rendition_is_hdr: false,
            gain_map_min: min_gain.to_vec(),
            gain_map_max: max_gain.to_vec(),
            gamma: vec![1.0, 1.0, 1.0],
            offset_sdr: vec![offset, offset, offset],
            offset_hdr: vec![offset, offset, offset],
            hdr_capacity_min: 0.0,
            hdr_capacity_max: target_capacity,
        }
    }
}

impl Default for MetadataComputer {
    fn default() -> Self {
        Self::new()
    }
}

/// Estimates the HDR headroom from metadata.
///
/// Returns the maximum additional stops of dynamic range above SDR.
pub fn estimate_hdr_headroom(metadata: &GainMapMetadata) -> f32 {
    let max_gain = metadata.gain_map_max.iter()
        .copied()
        .fold(f32::MIN, f32::max);
    max_gain.max(0.0)
}

/// Checks if metadata indicates a meaningful HDR image.
///
/// Returns true if the gain map provides significant dynamic range extension.
pub fn is_meaningful_hdr(metadata: &GainMapMetadata) -> bool {
    let headroom = estimate_hdr_headroom(metadata);
    headroom > 0.5 // More than half a stop of additional range
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_metadata_valid() {
        let metadata = GainMapMetadata::default();
        assert!(validate_metadata(&metadata).is_ok());
    }

    #[test]
    fn test_validate_metadata_invalid_channel_count() {
        let mut metadata = GainMapMetadata::default();
        metadata.gain_map_min = vec![0.0, 0.0]; // Only 2 values
        assert!(validate_metadata(&metadata).is_err());
    }

    #[test]
    fn test_validate_metadata_invalid_gain_range() {
        let mut metadata = GainMapMetadata::default();
        metadata.gain_map_min = vec![5.0, 5.0, 5.0];
        metadata.gain_map_max = vec![3.0, 3.0, 3.0]; // min > max
        assert!(validate_metadata(&metadata).is_err());
    }

    #[test]
    fn test_validate_metadata_invalid_gamma() {
        let mut metadata = GainMapMetadata::default();
        metadata.gamma = vec![1.0, -1.0, 1.0]; // Negative gamma
        assert!(validate_metadata(&metadata).is_err());
    }

    #[test]
    fn test_metadata_computer() {
        let mut computer = MetadataComputer::new();

        // Add some samples
        computer.add_sample([0.5, 0.5, 0.5], [1.0, 1.0, 1.0], 0.015625, 0.015625);
        computer.add_sample([0.3, 0.3, 0.3], [0.9, 0.9, 0.9], 0.015625, 0.015625);

        let metadata = computer.compute(3.0);
        assert_eq!(metadata.version, "1.0");
        assert!(!metadata.base_rendition_is_hdr);
    }

    #[test]
    fn test_estimate_hdr_headroom() {
        let metadata = GainMapMetadata {
            gain_map_max: vec![3.0, 3.0, 3.0],
            ..Default::default()
        };
        assert_eq!(estimate_hdr_headroom(&metadata), 3.0);
    }

    #[test]
    fn test_is_meaningful_hdr() {
        let low_hdr = GainMapMetadata {
            gain_map_max: vec![0.2, 0.2, 0.2],
            ..Default::default()
        };
        assert!(!is_meaningful_hdr(&low_hdr));

        let high_hdr = GainMapMetadata {
            gain_map_max: vec![3.0, 3.0, 3.0],
            ..Default::default()
        };
        assert!(is_meaningful_hdr(&high_hdr));
    }
}
