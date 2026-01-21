//! JPEG parsing and manipulation module.
//!
//! This module handles parsing and writing JPEG files, including:
//! - APP1 (Exif, XMP) segments
//! - APP2 (ICC profile, Extended XMP) segments
//! - MPF (Multi-Picture Format) for gain map storage

pub mod parser;
pub mod writer;
pub mod xmp;

pub use parser::{JpegParser, JpegSegment, MarkerType};
pub use writer::JpegWriter;
pub use xmp::{XmpParser, XmpWriter};
