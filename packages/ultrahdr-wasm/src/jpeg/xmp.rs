//! XMP metadata parsing and writing for gain map metadata.
//!
//! Handles the ISO 21496-1 and UltraHDR v1 XMP namespaces.

use crate::error::{Result, UltraHdrError};
use crate::types::GainMapMetadata;
use quick_xml::events::{BytesEnd, BytesStart, Event};
use quick_xml::{Reader, Writer};
use std::io::Cursor;

/// XMP namespace URIs
pub const HDRGM_NAMESPACE: &str = "http://ns.adobe.com/hdr-gain-map/1.0/";
pub const HDRGM_PREFIX: &str = "hdrgm";

pub const CONTAINER_NAMESPACE: &str = "http://ns.google.com/photos/1.0/container/";
pub const CONTAINER_PREFIX: &str = "Container";

pub const CONTAINER_ITEM_NAMESPACE: &str = "http://ns.google.com/photos/1.0/container/item/";
pub const CONTAINER_ITEM_PREFIX: &str = "Item";

/// XMP parser for gain map metadata.
pub struct XmpParser;

impl XmpParser {
    /// Parses gain map metadata from XMP data.
    pub fn parse(xmp_data: &[u8]) -> Result<GainMapMetadata> {
        let xmp_str = std::str::from_utf8(xmp_data)
            .map_err(|e| UltraHdrError::XmpError(format!("Invalid UTF-8 in XMP: {}", e)))?;

        Self::parse_str(xmp_str)
    }

    /// Parses gain map metadata from an XMP string.
    pub fn parse_str(xmp_str: &str) -> Result<GainMapMetadata> {
        let mut metadata = GainMapMetadata::default();
        let mut reader = Reader::from_str(xmp_str);
        reader.trim_text(true);

        let mut in_hdrgm = false;
        let mut current_element = String::new();

        loop {
            match reader.read_event() {
                Ok(Event::Start(e)) | Ok(Event::Empty(e)) => {
                    let name_bytes = e.name();
                    let name = std::str::from_utf8(name_bytes.as_ref()).unwrap_or("");

                    // Check for hdrgm: prefix
                    if name.starts_with("hdrgm:") || name.contains(":hdrgm:") {
                        in_hdrgm = true;
                        current_element = name.to_string();
                    }

                    // Parse attributes for RDF property syntax
                    for attr in e.attributes().flatten() {
                        let attr_name = std::str::from_utf8(attr.key.as_ref()).unwrap_or("");
                        let attr_value = std::str::from_utf8(&attr.value).unwrap_or("");

                        if attr_name.starts_with("hdrgm:") {
                            Self::set_metadata_field(&mut metadata, attr_name, attr_value)?;
                        }
                    }
                }
                Ok(Event::Text(e)) if in_hdrgm => {
                    let text = e.unescape().unwrap_or_default();
                    Self::set_metadata_field(&mut metadata, &current_element, &text)?;
                }
                Ok(Event::End(e)) => {
                    let name_bytes = e.name();
                    let name = std::str::from_utf8(name_bytes.as_ref()).unwrap_or("");
                    if name.starts_with("hdrgm:") {
                        in_hdrgm = false;
                        current_element.clear();
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => return Err(UltraHdrError::XmpError(format!("XML parse error: {}", e))),
                _ => {}
            }
        }

        Ok(metadata)
    }

    /// Checks if XMP data contains gain map metadata.
    pub fn has_gain_map_metadata(xmp_data: &[u8]) -> bool {
        let xmp_str = match std::str::from_utf8(xmp_data) {
            Ok(s) => s,
            Err(_) => return false,
        };

        xmp_str.contains(HDRGM_NAMESPACE) || xmp_str.contains("hdrgm:")
    }

    fn set_metadata_field(metadata: &mut GainMapMetadata, name: &str, value: &str) -> Result<()> {
        // Strip namespace prefix
        let field_name = name.split(':').last().unwrap_or(name);

        match field_name {
            "Version" => metadata.version = value.to_string(),
            "BaseRenditionIsHDR" => {
                metadata.base_rendition_is_hdr = value.eq_ignore_ascii_case("true") || value == "1";
            }
            "GainMapMin" => metadata.gain_map_min = Self::parse_float_array(value)?,
            "GainMapMax" => metadata.gain_map_max = Self::parse_float_array(value)?,
            "Gamma" => metadata.gamma = Self::parse_float_array(value)?,
            "OffsetSDR" => metadata.offset_sdr = Self::parse_float_array(value)?,
            "OffsetHDR" => metadata.offset_hdr = Self::parse_float_array(value)?,
            "HDRCapacityMin" => {
                metadata.hdr_capacity_min = value.parse().map_err(|_| {
                    UltraHdrError::MetadataError(format!("Invalid HDRCapacityMin: {}", value))
                })?;
            }
            "HDRCapacityMax" => {
                metadata.hdr_capacity_max = value.parse().map_err(|_| {
                    UltraHdrError::MetadataError(format!("Invalid HDRCapacityMax: {}", value))
                })?;
            }
            _ => {} // Ignore unknown fields
        }

        Ok(())
    }

    fn parse_float_array(value: &str) -> Result<Vec<f32>> {
        // Handle single value (applied to all channels)
        if !value.contains(',') && !value.contains(' ') {
            let v: f32 = value.trim().parse().map_err(|_| {
                UltraHdrError::MetadataError(format!("Invalid float value: {}", value))
            })?;
            return Ok(vec![v, v, v]);
        }

        // Handle comma or space separated values
        let parts: Vec<&str> = value.split(|c| c == ',' || c == ' ')
            .filter(|s| !s.is_empty())
            .collect();

        let mut result = Vec::with_capacity(parts.len());
        for part in parts {
            let v: f32 = part.trim().parse().map_err(|_| {
                UltraHdrError::MetadataError(format!("Invalid float value: {}", part))
            })?;
            result.push(v);
        }

        // Ensure we have exactly 3 values (RGB)
        match result.len() {
            1 => Ok(vec![result[0], result[0], result[0]]),
            3 => Ok(result),
            _ => Err(UltraHdrError::MetadataError(format!(
                "Expected 1 or 3 values, got {}",
                result.len()
            ))),
        }
    }
}

/// XMP writer for gain map metadata.
pub struct XmpWriter;

impl XmpWriter {
    /// Creates XMP data for gain map metadata (ISO 21496-1 format).
    pub fn create_iso_xmp(metadata: &GainMapMetadata) -> Result<Vec<u8>> {
        let mut writer = Writer::new(Cursor::new(Vec::new()));

        // XML declaration
        writer.write_event(Event::Decl(quick_xml::events::BytesDecl::new("1.0", Some("UTF-8"), None)))?;

        // XMP packet wrapper
        let mut xmpmeta = BytesStart::new("x:xmpmeta");
        xmpmeta.push_attribute(("xmlns:x", "adobe:ns:meta/"));
        writer.write_event(Event::Start(xmpmeta))?;

        // RDF root
        let mut rdf = BytesStart::new("rdf:RDF");
        rdf.push_attribute(("xmlns:rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#"));
        rdf.push_attribute(("xmlns:hdrgm", HDRGM_NAMESPACE));
        writer.write_event(Event::Start(rdf))?;

        // RDF Description
        let mut desc = BytesStart::new("rdf:Description");
        desc.push_attribute(("rdf:about", ""));

        // Add metadata as attributes
        let gain_map_min = Self::format_float_array(&metadata.gain_map_min);
        let gain_map_max = Self::format_float_array(&metadata.gain_map_max);
        let gamma = Self::format_float_array(&metadata.gamma);
        let offset_sdr = Self::format_float_array(&metadata.offset_sdr);
        let offset_hdr = Self::format_float_array(&metadata.offset_hdr);
        let hdr_capacity_min = format!("{:.6}", metadata.hdr_capacity_min);
        let hdr_capacity_max = format!("{:.6}", metadata.hdr_capacity_max);

        desc.push_attribute(("hdrgm:Version", metadata.version.as_str()));
        desc.push_attribute(("hdrgm:BaseRenditionIsHDR", if metadata.base_rendition_is_hdr { "True" } else { "False" }));
        desc.push_attribute(("hdrgm:GainMapMin", gain_map_min.as_str()));
        desc.push_attribute(("hdrgm:GainMapMax", gain_map_max.as_str()));
        desc.push_attribute(("hdrgm:Gamma", gamma.as_str()));
        desc.push_attribute(("hdrgm:OffsetSDR", offset_sdr.as_str()));
        desc.push_attribute(("hdrgm:OffsetHDR", offset_hdr.as_str()));
        desc.push_attribute(("hdrgm:HDRCapacityMin", hdr_capacity_min.as_str()));
        desc.push_attribute(("hdrgm:HDRCapacityMax", hdr_capacity_max.as_str()));

        writer.write_event(Event::Empty(desc))?;

        // Close elements
        writer.write_event(Event::End(BytesEnd::new("rdf:RDF")))?;
        writer.write_event(Event::End(BytesEnd::new("x:xmpmeta")))?;

        Ok(writer.into_inner().into_inner())
    }

    /// Creates XMP data with UltraHDR v1 Container extension.
    pub fn create_ultrahdr_v1_xmp(metadata: &GainMapMetadata, gain_map_mime: &str) -> Result<Vec<u8>> {
        let mut writer = Writer::new(Cursor::new(Vec::new()));

        // XML declaration
        writer.write_event(Event::Decl(quick_xml::events::BytesDecl::new("1.0", Some("UTF-8"), None)))?;

        // XMP packet wrapper
        let mut xmpmeta = BytesStart::new("x:xmpmeta");
        xmpmeta.push_attribute(("xmlns:x", "adobe:ns:meta/"));
        writer.write_event(Event::Start(xmpmeta))?;

        // RDF root
        let mut rdf = BytesStart::new("rdf:RDF");
        rdf.push_attribute(("xmlns:rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#"));
        rdf.push_attribute(("xmlns:hdrgm", HDRGM_NAMESPACE));
        rdf.push_attribute(("xmlns:Container", CONTAINER_NAMESPACE));
        rdf.push_attribute(("xmlns:Item", CONTAINER_ITEM_NAMESPACE));
        writer.write_event(Event::Start(rdf))?;

        // RDF Description with gain map metadata
        let gain_map_min = Self::format_float_array(&metadata.gain_map_min);
        let gain_map_max = Self::format_float_array(&metadata.gain_map_max);
        let gamma = Self::format_float_array(&metadata.gamma);
        let offset_sdr = Self::format_float_array(&metadata.offset_sdr);
        let offset_hdr = Self::format_float_array(&metadata.offset_hdr);
        let hdr_capacity_min = format!("{:.6}", metadata.hdr_capacity_min);
        let hdr_capacity_max = format!("{:.6}", metadata.hdr_capacity_max);

        let mut desc = BytesStart::new("rdf:Description");
        desc.push_attribute(("rdf:about", ""));
        desc.push_attribute(("hdrgm:Version", metadata.version.as_str()));
        desc.push_attribute(("hdrgm:BaseRenditionIsHDR", if metadata.base_rendition_is_hdr { "True" } else { "False" }));
        desc.push_attribute(("hdrgm:GainMapMin", gain_map_min.as_str()));
        desc.push_attribute(("hdrgm:GainMapMax", gain_map_max.as_str()));
        desc.push_attribute(("hdrgm:Gamma", gamma.as_str()));
        desc.push_attribute(("hdrgm:OffsetSDR", offset_sdr.as_str()));
        desc.push_attribute(("hdrgm:OffsetHDR", offset_hdr.as_str()));
        desc.push_attribute(("hdrgm:HDRCapacityMin", hdr_capacity_min.as_str()));
        desc.push_attribute(("hdrgm:HDRCapacityMax", hdr_capacity_max.as_str()));
        writer.write_event(Event::Start(desc))?;

        // Container:Directory
        writer.write_event(Event::Start(BytesStart::new("Container:Directory")))?;
        writer.write_event(Event::Start(BytesStart::new("rdf:Seq")))?;

        // Primary image item
        writer.write_event(Event::Start(BytesStart::new("rdf:li")))?;
        let mut primary_item = BytesStart::new("Container:Item");
        primary_item.push_attribute(("Item:Semantic", "Primary"));
        primary_item.push_attribute(("Item:Mime", "image/jpeg"));
        writer.write_event(Event::Empty(primary_item))?;
        writer.write_event(Event::End(BytesEnd::new("rdf:li")))?;

        // Gain map item
        writer.write_event(Event::Start(BytesStart::new("rdf:li")))?;
        let mut gainmap_item = BytesStart::new("Container:Item");
        gainmap_item.push_attribute(("Item:Semantic", "GainMap"));
        gainmap_item.push_attribute(("Item:Mime", gain_map_mime));
        writer.write_event(Event::Empty(gainmap_item))?;
        writer.write_event(Event::End(BytesEnd::new("rdf:li")))?;

        writer.write_event(Event::End(BytesEnd::new("rdf:Seq")))?;
        writer.write_event(Event::End(BytesEnd::new("Container:Directory")))?;

        // Close elements
        writer.write_event(Event::End(BytesEnd::new("rdf:Description")))?;
        writer.write_event(Event::End(BytesEnd::new("rdf:RDF")))?;
        writer.write_event(Event::End(BytesEnd::new("x:xmpmeta")))?;

        Ok(writer.into_inner().into_inner())
    }

    /// Creates combined XMP data with both ISO 21496-1 and UltraHDR v1 metadata.
    pub fn create_combined_xmp(metadata: &GainMapMetadata) -> Result<Vec<u8>> {
        Self::create_ultrahdr_v1_xmp(metadata, "image/jpeg")
    }

    fn format_float_array(values: &[f32]) -> String {
        if values.len() == 3 && values[0] == values[1] && values[1] == values[2] {
            // Single value if all channels are the same
            format!("{:.6}", values[0])
        } else {
            values.iter()
                .map(|v| format!("{:.6}", v))
                .collect::<Vec<_>>()
                .join(", ")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_gain_map_metadata() {
        let xmp = r#"<?xml version="1.0" encoding="UTF-8"?>
        <x:xmpmeta xmlns:x="adobe:ns:meta/">
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                     xmlns:hdrgm="http://ns.adobe.com/hdr-gain-map/1.0/">
                <rdf:Description rdf:about=""
                    hdrgm:Version="1.0"
                    hdrgm:BaseRenditionIsHDR="False"
                    hdrgm:GainMapMin="0.0"
                    hdrgm:GainMapMax="3.0"
                    hdrgm:Gamma="1.0"
                    hdrgm:OffsetSDR="0.015625"
                    hdrgm:OffsetHDR="0.015625"
                    hdrgm:HDRCapacityMin="0.0"
                    hdrgm:HDRCapacityMax="3.0"/>
            </rdf:RDF>
        </x:xmpmeta>"#;

        let metadata = XmpParser::parse_str(xmp).unwrap();
        assert_eq!(metadata.version, "1.0");
        assert!(!metadata.base_rendition_is_hdr);
        assert_eq!(metadata.gain_map_max, vec![3.0, 3.0, 3.0]);
        assert_eq!(metadata.hdr_capacity_max, 3.0);
    }

    #[test]
    fn test_write_iso_xmp() {
        let metadata = GainMapMetadata::default();
        let xmp = XmpWriter::create_iso_xmp(&metadata).unwrap();
        let xmp_str = std::str::from_utf8(&xmp).unwrap();

        assert!(xmp_str.contains("hdrgm:Version"));
        assert!(xmp_str.contains(HDRGM_NAMESPACE));
    }

    #[test]
    fn test_has_gain_map_metadata() {
        let xmp_with = b"<x:xmpmeta xmlns:hdrgm=\"http://ns.adobe.com/hdr-gain-map/1.0/\"></x:xmpmeta>";
        let xmp_without = b"<x:xmpmeta></x:xmpmeta>";

        assert!(XmpParser::has_gain_map_metadata(xmp_with));
        assert!(!XmpParser::has_gain_map_metadata(xmp_without));
    }

    #[test]
    fn test_roundtrip() {
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
}
