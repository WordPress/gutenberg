#!/usr/bin/env node
/**
 * Puts the detection model and an inference runtime where a WordPress install
 * can serve them from, for testing the subject-aware cropping experiment.
 *
 * This is deliberately not part of `npm run build`.
 *
 * ONNX Runtime's own code is MIT, but the WebAssembly binary it ships has
 * Apache-2.0 components compiled into it, and Gutenberg's licence check treats
 * Apache-2.0 as something the project can build with but cannot distribute.
 * So the plugin does not ship a runtime: anyone testing the experiment puts
 * one in place themselves, with this script or by hand, and the experiment
 * falls back to centre cropping when it is not there.
 *
 * See packages/subject-detection/README.md for what would have to change for
 * this to ship, and for the GPLv2-compatible runtimes that were considered.
 *
 *   node packages/subject-detection/bin/install-runtime.mjs
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../../..' );
const OUTPUT_DIR = path.join( ROOT_DIR, 'build', 'media-detection' );

const FILES = [
	'node_modules/onnxruntime-web/dist/ort.wasm.min.mjs',
	'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
	'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
	'packages/subject-detection/assets/face_detection_yunet_2023mar.onnx',
];

await mkdir( OUTPUT_DIR, { recursive: true } );

for ( const file of FILES ) {
	await copyFile(
		path.join( ROOT_DIR, file ),
		path.join( OUTPUT_DIR, path.basename( file ) )
	);
}

console.log( `Installed ${ FILES.length } files into build/media-detection/.` );
