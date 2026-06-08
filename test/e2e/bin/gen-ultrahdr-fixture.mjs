/**
 * One-shot generator for the UltraHDR e2e fixture.
 *
 * Regenerate with:
 *   cd test/e2e/bin
 *   node gen-ultrahdr-fixture.mjs ../assets/1024x768_e2e_test_image_ultrahdr.jpeg
 *
 * Synthesizes a small UltraHDR JPEG (ISO 21496-1 gain map) using wasm-vips's
 * encoder so we don't need to vendor a binary asset from a third-party source.
 *
 * Run manually (not part of CI). `wasm-vips` resolves through the workspace
 * via `@wordpress/vips`; console output is the script's user interface.
 */
/* eslint-disable import/no-extraneous-dependencies */
import Vips from 'wasm-vips';
import fs from 'node:fs';

const out = process.argv[ 2 ];
if ( ! out ) {
	console.error( 'Usage: node gen-ultrahdr-fixture.mjs <output.jpeg>' );
	process.exit( 1 );
}

const vips = await Vips( {} );

const w = 1024;
const h = 768;

// Base sRGB SDR rendition: simple horizontal gradient.
const xramp = vips.Image.identity( { size: w } )
	.cast( 'uchar' )
	.embed( 0, 0, w, h, { extend: 'copy' } );
const yramp = vips.Image.identity( { size: h } )
	.cast( 'uchar' )
	.rot90()
	.embed( 0, 0, w, h, { extend: 'copy' } );
const constB = vips.Image.black( w, h ).add( 80 ).cast( 'uchar' );
const base = xramp
	.bandjoin( [ yramp, constB ] )
	.copy( { interpretation: 'srgb' } );

// Gain map: half-resolution greyscale, mid-grey for moderate boost.
const gw = w / 2;
const gh = h / 2;
const gainmap = vips.Image.black( gw, gh )
	.add( 128 )
	.cast( 'uchar' )
	.copy( { interpretation: 'b-w' } );

// Attach the gain map to the base. libvips understands the `gainmap`
// metadata key and embeds it in the saved UltraHDR JPEG.
base.setImage( 'gainmap', gainmap );

// Required ISO 21496-1 metadata fields libvips/libultrahdr expects on
// the base image. Per-channel fields are RGB triplets; capacity fields are
// scalars. Values match a moderate 3-stop boost.
base.setArrayDouble( 'gainmap-min-content-boost', [ 1.0, 1.0, 1.0 ] );
base.setArrayDouble( 'gainmap-max-content-boost', [ 8.0, 8.0, 8.0 ] );
base.setDouble( 'gainmap-hdr-capacity-min', 1.0 );
base.setDouble( 'gainmap-hdr-capacity-max', 8.0 );
base.setArrayDouble( 'gainmap-gamma', [ 1.0, 1.0, 1.0 ] );
base.setArrayDouble( 'gainmap-offset-sdr', [ 0.015625, 0.015625, 0.015625 ] );
base.setArrayDouble( 'gainmap-offset-hdr', [ 0.015625, 0.015625, 0.015625 ] );
base.setInt( 'gainmap-base-rendition-is-hdr', 0 );
base.setInt( 'gainmap-use-base-cg', 1 );

try {
	const buf = base.uhdrsaveBuffer( { Q: 85 } );
	fs.writeFileSync( out, Buffer.from( buf ) );
	console.log( `Wrote ${ buf.length } bytes to ${ out }` );
} catch ( err ) {
	console.error( 'uhdrsaveBuffer failed:', err.message );
	console.error( vips.error || vips.Error?.message || '(no extra detail)' );
	process.exit( 1 );
}
/* eslint-enable import/no-extraneous-dependencies */
