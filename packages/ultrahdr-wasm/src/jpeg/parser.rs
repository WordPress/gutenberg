//! JPEG segment parser.
//!
//! Parses JPEG files to extract APP1, APP2, and other relevant segments
//! for UltraHDR processing.

use crate::error::{Result, UltraHdrError};
use std::io::{Cursor, Read};

/// JPEG marker types.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MarkerType {
    /// Start of Image
    Soi,
    /// End of Image
    Eoi,
    /// APP0 (JFIF)
    App0,
    /// APP1 (Exif, XMP)
    App1,
    /// APP2 (ICC profile, Extended XMP, MPF)
    App2,
    /// APP3-APP15
    AppN(u8),
    /// Start of Frame (Baseline DCT)
    Sof0,
    /// Start of Frame (Progressive DCT)
    Sof2,
    /// Define Huffman Table
    Dht,
    /// Define Quantization Table
    Dqt,
    /// Define Restart Interval
    Dri,
    /// Start of Scan
    Sos,
    /// Comment
    Com,
    /// Other marker
    Other(u8),
}

impl MarkerType {
    /// Creates a MarkerType from a byte value.
    pub fn from_byte(byte: u8) -> Self {
        match byte {
            0xD8 => MarkerType::Soi,
            0xD9 => MarkerType::Eoi,
            0xE0 => MarkerType::App0,
            0xE1 => MarkerType::App1,
            0xE2 => MarkerType::App2,
            0xE3..=0xEF => MarkerType::AppN(byte - 0xE0),
            0xC0 => MarkerType::Sof0,
            0xC2 => MarkerType::Sof2,
            0xC4 => MarkerType::Dht,
            0xDB => MarkerType::Dqt,
            0xDD => MarkerType::Dri,
            0xDA => MarkerType::Sos,
            0xFE => MarkerType::Com,
            _ => MarkerType::Other(byte),
        }
    }

    /// Converts the marker type to its byte value.
    pub fn to_byte(&self) -> u8 {
        match self {
            MarkerType::Soi => 0xD8,
            MarkerType::Eoi => 0xD9,
            MarkerType::App0 => 0xE0,
            MarkerType::App1 => 0xE1,
            MarkerType::App2 => 0xE2,
            MarkerType::AppN(n) => 0xE0 + n,
            MarkerType::Sof0 => 0xC0,
            MarkerType::Sof2 => 0xC2,
            MarkerType::Dht => 0xC4,
            MarkerType::Dqt => 0xDB,
            MarkerType::Dri => 0xDD,
            MarkerType::Sos => 0xDA,
            MarkerType::Com => 0xFE,
            MarkerType::Other(b) => *b,
        }
    }

    /// Returns true if this marker has an associated length field.
    pub fn has_length(&self) -> bool {
        !matches!(self, MarkerType::Soi | MarkerType::Eoi | MarkerType::Other(0x00) | MarkerType::Other(0xFF))
    }
}

/// A JPEG segment with marker and data.
#[derive(Debug, Clone)]
pub struct JpegSegment {
    /// The marker type
    pub marker: MarkerType,
    /// The segment data (excluding marker and length bytes)
    pub data: Vec<u8>,
    /// Original offset in the file
    pub offset: usize,
}

impl JpegSegment {
    /// Creates a new JPEG segment.
    pub fn new(marker: MarkerType, data: Vec<u8>, offset: usize) -> Self {
        Self { marker, data, offset }
    }

    /// Checks if this segment contains XMP data.
    pub fn is_xmp(&self) -> bool {
        if self.marker != MarkerType::App1 {
            return false;
        }
        self.data.starts_with(b"http://ns.adobe.com/xap/1.0/\0")
    }

    /// Checks if this segment contains Extended XMP data.
    pub fn is_extended_xmp(&self) -> bool {
        if self.marker != MarkerType::App1 {
            return false;
        }
        self.data.starts_with(b"http://ns.adobe.com/xmp/extension/\0")
    }

    /// Checks if this segment contains Exif data.
    pub fn is_exif(&self) -> bool {
        if self.marker != MarkerType::App1 {
            return false;
        }
        self.data.starts_with(b"Exif\0\0")
    }

    /// Checks if this segment contains an ICC profile.
    pub fn is_icc_profile(&self) -> bool {
        if self.marker != MarkerType::App2 {
            return false;
        }
        self.data.starts_with(b"ICC_PROFILE\0")
    }

    /// Checks if this segment is an MPF (Multi-Picture Format) segment.
    pub fn is_mpf(&self) -> bool {
        if self.marker != MarkerType::App2 {
            return false;
        }
        self.data.starts_with(b"MPF\0")
    }

    /// Gets the XMP data if this is an XMP segment.
    pub fn get_xmp_data(&self) -> Option<&[u8]> {
        if !self.is_xmp() {
            return None;
        }
        // Skip "http://ns.adobe.com/xap/1.0/\0" (29 bytes)
        Some(&self.data[29..])
    }
}

/// JPEG file parser.
pub struct JpegParser {
    segments: Vec<JpegSegment>,
    scan_data: Vec<u8>,
    scan_offset: usize,
}

impl JpegParser {
    /// Parses a JPEG file from a byte buffer.
    pub fn parse(data: &[u8]) -> Result<Self> {
        if data.len() < 2 {
            return Err(UltraHdrError::InvalidJpeg("File too small".to_string()));
        }

        // Check for JPEG magic bytes
        if data[0] != 0xFF || data[1] != 0xD8 {
            return Err(UltraHdrError::InvalidJpeg("Missing JPEG SOI marker".to_string()));
        }

        let mut segments = Vec::new();
        let mut cursor = Cursor::new(data);
        let mut scan_data = Vec::new();
        let mut scan_offset = 0;

        // Add SOI segment
        segments.push(JpegSegment::new(MarkerType::Soi, Vec::new(), 0));
        cursor.set_position(2);

        loop {
            let pos = cursor.position() as usize;
            if pos >= data.len() {
                break;
            }

            // Look for marker
            let mut marker_byte = [0u8; 1];
            if cursor.read_exact(&mut marker_byte).is_err() {
                break;
            }

            if marker_byte[0] != 0xFF {
                // Not a marker, might be in scan data
                continue;
            }

            // Skip padding 0xFF bytes
            loop {
                if cursor.read_exact(&mut marker_byte).is_err() {
                    break;
                }
                if marker_byte[0] != 0xFF {
                    break;
                }
            }

            let marker = MarkerType::from_byte(marker_byte[0]);

            match marker {
                MarkerType::Eoi => {
                    segments.push(JpegSegment::new(MarkerType::Eoi, Vec::new(), cursor.position() as usize - 2));
                    break;
                }
                MarkerType::Soi => {
                    // Shouldn't happen, but handle it
                    continue;
                }
                MarkerType::Sos => {
                    // Start of Scan - read length and data
                    let mut len_bytes = [0u8; 2];
                    cursor.read_exact(&mut len_bytes)?;
                    let len = u16::from_be_bytes(len_bytes) as usize;

                    let mut segment_data = vec![0u8; len - 2];
                    cursor.read_exact(&mut segment_data)?;

                    segments.push(JpegSegment::new(MarkerType::Sos, segment_data, pos));

                    // After SOS comes the entropy-coded data
                    scan_offset = cursor.position() as usize;

                    // Read until we find EOI or another marker
                    let mut in_scan = true;
                    while in_scan && (cursor.position() as usize) < data.len() {
                        let mut byte = [0u8; 1];
                        if cursor.read_exact(&mut byte).is_err() {
                            break;
                        }

                        if byte[0] == 0xFF {
                            if cursor.read_exact(&mut byte).is_err() {
                                break;
                            }

                            if byte[0] == 0x00 {
                                // Stuffed byte, part of scan data
                                scan_data.push(0xFF);
                                scan_data.push(0x00);
                            } else if byte[0] == 0xD9 {
                                // EOI
                                segments.push(JpegSegment::new(MarkerType::Eoi, Vec::new(), cursor.position() as usize - 2));
                                in_scan = false;
                            } else if byte[0] >= 0xD0 && byte[0] <= 0xD7 {
                                // Restart marker
                                scan_data.push(0xFF);
                                scan_data.push(byte[0]);
                            } else {
                                // Another marker - back up
                                cursor.set_position(cursor.position() - 2);
                                in_scan = false;
                            }
                        } else {
                            scan_data.push(byte[0]);
                        }
                    }
                }
                _ if marker.has_length() => {
                    // Read length and data
                    let mut len_bytes = [0u8; 2];
                    cursor.read_exact(&mut len_bytes)?;
                    let len = u16::from_be_bytes(len_bytes) as usize;

                    if len < 2 {
                        return Err(UltraHdrError::InvalidJpeg(format!(
                            "Invalid segment length {} at offset {}",
                            len, pos
                        )));
                    }

                    let mut segment_data = vec![0u8; len - 2];
                    cursor.read_exact(&mut segment_data)?;

                    segments.push(JpegSegment::new(marker, segment_data, pos));
                }
                _ => {
                    // Marker without length
                    segments.push(JpegSegment::new(marker, Vec::new(), pos));
                }
            }
        }

        Ok(Self {
            segments,
            scan_data,
            scan_offset,
        })
    }

    /// Returns all segments.
    pub fn segments(&self) -> &[JpegSegment] {
        &self.segments
    }

    /// Returns the scan data (entropy-coded image data).
    pub fn scan_data(&self) -> &[u8] {
        &self.scan_data
    }

    /// Returns the scan data offset in the original file.
    pub fn scan_offset(&self) -> usize {
        self.scan_offset
    }

    /// Finds all APP1 segments.
    pub fn find_app1_segments(&self) -> Vec<&JpegSegment> {
        self.segments
            .iter()
            .filter(|s| s.marker == MarkerType::App1)
            .collect()
    }

    /// Finds all APP2 segments.
    pub fn find_app2_segments(&self) -> Vec<&JpegSegment> {
        self.segments
            .iter()
            .filter(|s| s.marker == MarkerType::App2)
            .collect()
    }

    /// Finds the XMP segment.
    pub fn find_xmp_segment(&self) -> Option<&JpegSegment> {
        self.segments.iter().find(|s| s.is_xmp())
    }

    /// Finds the Exif segment.
    pub fn find_exif_segment(&self) -> Option<&JpegSegment> {
        self.segments.iter().find(|s| s.is_exif())
    }

    /// Finds the MPF segment.
    pub fn find_mpf_segment(&self) -> Option<&JpegSegment> {
        self.segments.iter().find(|s| s.is_mpf())
    }

    /// Finds the SOF (Start of Frame) segment to get image dimensions.
    pub fn find_sof_segment(&self) -> Option<&JpegSegment> {
        self.segments
            .iter()
            .find(|s| matches!(s.marker, MarkerType::Sof0 | MarkerType::Sof2))
    }

    /// Gets image dimensions from the SOF segment.
    pub fn get_dimensions(&self) -> Option<(u32, u32)> {
        let sof = self.find_sof_segment()?;
        if sof.data.len() < 5 {
            return None;
        }
        let height = u16::from_be_bytes([sof.data[1], sof.data[2]]) as u32;
        let width = u16::from_be_bytes([sof.data[3], sof.data[4]]) as u32;
        Some((width, height))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_marker_type_conversion() {
        assert_eq!(MarkerType::from_byte(0xD8), MarkerType::Soi);
        assert_eq!(MarkerType::from_byte(0xE1), MarkerType::App1);
        assert_eq!(MarkerType::App1.to_byte(), 0xE1);
    }

    #[test]
    fn test_minimal_jpeg() {
        // Minimal valid JPEG: SOI + EOI
        let data = vec![0xFF, 0xD8, 0xFF, 0xD9];
        let parser = JpegParser::parse(&data).unwrap();
        assert_eq!(parser.segments().len(), 2);
        assert_eq!(parser.segments()[0].marker, MarkerType::Soi);
        assert_eq!(parser.segments()[1].marker, MarkerType::Eoi);
    }

    #[test]
    fn test_invalid_jpeg() {
        let data = vec![0x00, 0x00];
        assert!(JpegParser::parse(&data).is_err());
    }
}
