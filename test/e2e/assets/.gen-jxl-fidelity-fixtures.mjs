/**
 * One-shot generator for the JPEG XL fidelity-preservation e2e fixtures.
 *
 * Regenerate with (requires `cjxl` from libjxl and ImageMagick `magick` on PATH):
 *   cd test/e2e/assets
 *   node .gen-jxl-fidelity-fixtures.mjs
 *
 * Produces two 200x150 JXL fixtures used by the "preserves the original ...
 * JXL" client-side media processing tests:
 *
 *   200x150_e2e_test_image_hdr.jxl
 *     A genuine 16-bit (>8-bit, "HDR") JXL. Decodes in wasm-vips as
 *     rgb16/ushort. Proves CSM flattens high-bit-depth JXL to an 8-bit JPEG
 *     for sub-sizes while preserving the 16-bit original byte-for-byte.
 *
 *   200x150_e2e_test_image_gainmap.jxl
 *     An 8-bit JXL carrying an ISO-BMFF `jhgm` (ISO 21496-1 gain map) box.
 *     libjxl/cjxl 0.11 has no CLI to author a gain map, and wasm-vips'
 *     `jxlsave` drops gain-map metadata, so the box is appended manually: a
 *     real (grayscale JPEG) gain map image wrapped in a `jhgm`-typed box after
 *     the primary codestream. wasm-vips decodes the primary and ignores the
 *     trailing box, which is exactly the path under test. Proves the gain map
 *     survives in the preserved original even though sub-sizes drop it.
 *
 * Run manually (not part of CI); console output is the script's UI.
 */
/* eslint-disable no-console */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync( path.join( os.tmpdir(), 'jxl-fixtures-' ) );
const run = ( cmd, args ) => execFileSync( cmd, args, { stdio: 'inherit' } );

// --- 16-bit HDR fixture -------------------------------------------------
const hdrSrc = path.join( tmp, 'hdr_src.png' );
run( 'magick', [
	'-size',
	'200x150',
	'gradient:black-white',
	'-depth',
	'16',
	'-define',
	'png:color-type=2',
	hdrSrc,
] );
// -d 0 = mathematically lossless, preserving the full 16-bit depth.
run( 'cjxl', [
	hdrSrc,
	'200x150_e2e_test_image_hdr.jxl',
	'-d',
	'0',
	'-e',
	'3',
] );

// --- gain-map fixture ---------------------------------------------------
const gmSrc = path.join( tmp, 'gm_src.png' );
const gmBase = path.join( tmp, 'gm_base.jxl' );
const gmPayload = path.join( tmp, 'gainmap.jpg' );
run( 'magick', [
	'-size',
	'200x150',
	'gradient:navy-orange',
	'-depth',
	'8',
	gmSrc,
] );
run( 'cjxl', [ gmSrc, gmBase, '-q', '90', '-e', '3' ] );
// Synthesize a plausible half-resolution grayscale gain map image.
run( 'magick', [
	'-size',
	'100x75',
	'gradient:black-white',
	'-colorspace',
	'Gray',
	gmPayload,
] );

const base = fs.readFileSync( gmBase );
const payload = fs.readFileSync( gmPayload );
// ISO-BMFF box: uint32 big-endian size (incl. 8-byte header) + 4-char type.
const header = Buffer.alloc( 8 );
header.writeUInt32BE( 8 + payload.length, 0 );
header.write( 'jhgm', 4, 'ascii' );
fs.writeFileSync(
	'200x150_e2e_test_image_gainmap.jxl',
	Buffer.concat( [ base, header, payload ] )
);

fs.rmSync( tmp, { recursive: true, force: true } );
console.log(
	'Wrote 200x150_e2e_test_image_hdr.jxl and 200x150_e2e_test_image_gainmap.jxl'
);
/* eslint-enable no-console */
