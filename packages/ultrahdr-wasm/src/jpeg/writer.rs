//! JPEG segment writer.
//!
//! Writes JPEG files with modified or added segments for UltraHDR.

use crate::error::{Result, UltraHdrError};
use super::parser::{JpegSegment, MarkerType};
use std::io::Write;

/// JPEG file writer for creating UltraHDR images.
pub struct JpegWriter {
    segments: Vec<JpegSegment>,
    scan_data: Vec<u8>,
}

impl JpegWriter {
    /// Creates a new JPEG writer with segments from a parsed JPEG.
    pub fn new(segments: Vec<JpegSegment>, scan_data: Vec<u8>) -> Self {
        Self { segments, scan_data }
    }

    /// Creates an empty JPEG writer.
    pub fn empty() -> Self {
        Self {
            segments: Vec::new(),
            scan_data: Vec::new(),
        }
    }

    /// Adds a segment to the JPEG.
    pub fn add_segment(&mut self, segment: JpegSegment) {
        self.segments.push(segment);
    }

    /// Inserts a segment at a specific index.
    pub fn insert_segment(&mut self, index: usize, segment: JpegSegment) {
        self.segments.insert(index, segment);
    }

    /// Adds an XMP segment with the given XMP data.
    pub fn add_xmp_segment(&mut self, xmp_data: &[u8]) -> Result<()> {
        const XMP_NAMESPACE: &[u8] = b"http://ns.adobe.com/xap/1.0/\0";

        if xmp_data.len() + XMP_NAMESPACE.len() > 65533 {
            return Err(UltraHdrError::XmpError(
                "XMP data too large for single segment".to_string()
            ));
        }

        let mut data = Vec::with_capacity(XMP_NAMESPACE.len() + xmp_data.len());
        data.extend_from_slice(XMP_NAMESPACE);
        data.extend_from_slice(xmp_data);

        let segment = JpegSegment::new(MarkerType::App1, data, 0);

        // Insert after JFIF/Exif but before other segments
        let insert_pos = self.find_xmp_insert_position();
        self.insert_segment(insert_pos, segment);

        Ok(())
    }

    /// Adds an Extended XMP segment.
    pub fn add_extended_xmp_segment(&mut self, xmp_data: &[u8], md5_digest: &str, offset: u32, total_length: u32) -> Result<()> {
        const EXT_XMP_NAMESPACE: &[u8] = b"http://ns.adobe.com/xmp/extension/\0";

        let mut data = Vec::with_capacity(EXT_XMP_NAMESPACE.len() + 32 + 8 + xmp_data.len());
        data.extend_from_slice(EXT_XMP_NAMESPACE);

        // MD5 digest (32 bytes hex string)
        data.extend_from_slice(md5_digest.as_bytes());

        // Full length of extended XMP (4 bytes, big-endian)
        data.extend_from_slice(&total_length.to_be_bytes());

        // Offset of this chunk (4 bytes, big-endian)
        data.extend_from_slice(&offset.to_be_bytes());

        // XMP data
        data.extend_from_slice(xmp_data);

        let segment = JpegSegment::new(MarkerType::App1, data, 0);

        // Insert after regular XMP
        let insert_pos = self.find_extended_xmp_insert_position();
        self.insert_segment(insert_pos, segment);

        Ok(())
    }

    /// Adds an MPF (Multi-Picture Format) segment for the gain map.
    pub fn add_mpf_segment(&mut self, gain_map_offset: u32, gain_map_size: u32) -> Result<()> {
        let mpf_data = create_mpf_data(gain_map_offset, gain_map_size);
        let segment = JpegSegment::new(MarkerType::App2, mpf_data, 0);

        // Insert MPF after APP1 segments
        let insert_pos = self.find_mpf_insert_position();
        self.insert_segment(insert_pos, segment);

        Ok(())
    }

    /// Removes all XMP segments.
    pub fn remove_xmp_segments(&mut self) {
        self.segments.retain(|s| !s.is_xmp() && !s.is_extended_xmp());
    }

    /// Removes all MPF segments.
    pub fn remove_mpf_segments(&mut self) {
        self.segments.retain(|s| !s.is_mpf());
    }

    /// Sets the scan data.
    pub fn set_scan_data(&mut self, data: Vec<u8>) {
        self.scan_data = data;
    }

    /// Writes the JPEG to a byte vector.
    pub fn write(&self) -> Result<Vec<u8>> {
        let mut output = Vec::new();

        // Write SOI
        output.write_all(&[0xFF, 0xD8])?;

        for segment in &self.segments {
            match segment.marker {
                MarkerType::Soi | MarkerType::Eoi => {
                    // These are handled separately
                    continue;
                }
                MarkerType::Sos => {
                    // Write SOS marker
                    output.write_all(&[0xFF, segment.marker.to_byte()])?;
                    let len = (segment.data.len() + 2) as u16;
                    output.write_all(&len.to_be_bytes())?;
                    output.write_all(&segment.data)?;

                    // Write scan data
                    output.write_all(&self.scan_data)?;
                }
                _ if segment.marker.has_length() => {
                    output.write_all(&[0xFF, segment.marker.to_byte()])?;
                    let len = (segment.data.len() + 2) as u16;
                    output.write_all(&len.to_be_bytes())?;
                    output.write_all(&segment.data)?;
                }
                _ => {
                    output.write_all(&[0xFF, segment.marker.to_byte()])?;
                }
            }
        }

        // Write EOI
        output.write_all(&[0xFF, 0xD9])?;

        Ok(output)
    }

    /// Writes the JPEG with an appended gain map.
    pub fn write_with_gain_map(&self, gain_map_jpeg: &[u8]) -> Result<Vec<u8>> {
        let base_jpeg = self.write()?;

        let mut output = Vec::with_capacity(base_jpeg.len() + gain_map_jpeg.len());
        output.extend_from_slice(&base_jpeg);
        output.extend_from_slice(gain_map_jpeg);

        Ok(output)
    }

    fn find_xmp_insert_position(&self) -> usize {
        // Insert after SOI, JFIF (APP0), and Exif (APP1)
        for (i, segment) in self.segments.iter().enumerate() {
            match segment.marker {
                MarkerType::Soi | MarkerType::App0 => continue,
                MarkerType::App1 if segment.is_exif() => continue,
                _ => return i,
            }
        }
        self.segments.len()
    }

    fn find_extended_xmp_insert_position(&self) -> usize {
        // Insert after regular XMP
        for (i, segment) in self.segments.iter().enumerate() {
            if segment.is_xmp() {
                return i + 1;
            }
        }
        self.find_xmp_insert_position()
    }

    fn find_mpf_insert_position(&self) -> usize {
        // Insert after all APP1 segments
        for (i, segment) in self.segments.iter().enumerate().rev() {
            if segment.marker == MarkerType::App1 {
                return i + 1;
            }
        }
        // If no APP1, insert after APP0
        for (i, segment) in self.segments.iter().enumerate() {
            if segment.marker == MarkerType::App0 {
                return i + 1;
            }
        }
        // Fallback: after SOI
        1
    }
}

/// Creates MPF (Multi-Picture Format) data for the gain map reference.
fn create_mpf_data(gain_map_offset: u32, gain_map_size: u32) -> Vec<u8> {
    const MPF_HEADER: &[u8] = b"MPF\0";

    let mut data = Vec::new();
    data.extend_from_slice(MPF_HEADER);

    // Byte order (little-endian: II, big-endian: MM)
    data.extend_from_slice(b"II");

    // Fixed value 0x002A
    data.extend_from_slice(&[0x2A, 0x00]);

    // Offset to first IFD (8 bytes from start of TIFF header)
    data.extend_from_slice(&8u32.to_le_bytes());

    // IFD Entry Count: 3 entries
    data.extend_from_slice(&3u16.to_le_bytes());

    // Entry 1: MPFVersion (0xB000)
    data.extend_from_slice(&0xB000u16.to_le_bytes()); // Tag
    data.extend_from_slice(&7u16.to_le_bytes());      // Type: UNDEFINED
    data.extend_from_slice(&4u32.to_le_bytes());      // Count
    data.extend_from_slice(b"0100");                  // Value: "0100"

    // Entry 2: NumberOfImages (0xB001)
    data.extend_from_slice(&0xB001u16.to_le_bytes()); // Tag
    data.extend_from_slice(&4u32.to_le_bytes());      // Type: LONG
    data.extend_from_slice(&1u32.to_le_bytes());      // Count
    data.extend_from_slice(&2u32.to_le_bytes());      // Value: 2 images

    // Entry 3: MPEntry (0xB002) - offset to MP Entry
    let mp_entry_offset: u32 = 8 + 2 + (3 * 12) + 4; // TIFF header + count + 3 entries + next IFD pointer
    data.extend_from_slice(&0xB002u16.to_le_bytes()); // Tag
    data.extend_from_slice(&7u16.to_le_bytes());      // Type: UNDEFINED
    data.extend_from_slice(&32u32.to_le_bytes());     // Count: 16 bytes per entry * 2 entries
    data.extend_from_slice(&mp_entry_offset.to_le_bytes()); // Offset

    // Next IFD pointer (0 = no more IFDs)
    data.extend_from_slice(&0u32.to_le_bytes());

    // MP Entry for primary image
    data.extend_from_slice(&0x20030000u32.to_le_bytes()); // Image flags (primary, JPEG)
    data.extend_from_slice(&0u32.to_le_bytes());          // Size (0 for primary = use actual)
    data.extend_from_slice(&0u32.to_le_bytes());          // Offset (0 for primary)
    data.extend_from_slice(&0u16.to_le_bytes());          // Dependent image 1
    data.extend_from_slice(&0u16.to_le_bytes());          // Dependent image 2

    // MP Entry for gain map
    data.extend_from_slice(&0x00030000u32.to_le_bytes()); // Image flags (JPEG, not primary)
    data.extend_from_slice(&gain_map_size.to_le_bytes()); // Size
    data.extend_from_slice(&gain_map_offset.to_le_bytes()); // Offset from start of file
    data.extend_from_slice(&0u16.to_le_bytes());          // Dependent image 1
    data.extend_from_slice(&0u16.to_le_bytes());          // Dependent image 2

    data
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_mpf_data() {
        let data = create_mpf_data(1000, 500);
        assert!(data.starts_with(b"MPF\0"));
    }

    #[test]
    fn test_empty_writer() {
        let writer = JpegWriter::empty();
        let result = writer.write().unwrap();
        // Should have SOI + EOI
        assert_eq!(result, vec![0xFF, 0xD8, 0xFF, 0xD9]);
    }
}
