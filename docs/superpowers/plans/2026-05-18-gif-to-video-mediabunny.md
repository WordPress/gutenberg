# mediabunny GIF→Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `@wordpress/mediabunny` package that converts animated GIFs to MP4/WebM during upload using the browser's WebCodecs `ImageDecoder` plus the mediabunny library, as a standalone alternative to the FFmpeg-WASM PR #76946.

**Architecture:** Structurally parallel to the proposed `@wordpress/ffmpeg` and the existing `@wordpress/vips`: a worker-threads package exposing `convertGifToVideo`/`cancelOperations`, lazily loaded by `@wordpress/upload-media`. The novel part is the conversion pipeline: `ImageDecoder` decodes GIF frames (honoring per-frame delays) → mediabunny `VideoSampleSource` → `Output` (MP4/WebM) → `ArrayBuffer`. No WASM, no `SharedArrayBuffer`-specific code; encoding delegates to native WebCodecs.

**Tech Stack:** TypeScript, `mediabunny` (npm, MPL-2.0), browser WebCodecs (`ImageDecoder`, `VideoEncoder`), `@wordpress/worker-threads`, `@wordpress/upload-media` store (Redux-like), Jest, Playwright.

**Reference:** PR #76946 diff at `/tmp/pr76946.diff`; spec at `docs/superpowers/specs/2026-05-18-gif-to-video-mediabunny-design.md`. Run all commands from the repo root `/Users/adamsilverstein/repositories/gutenberg-mediabunny`. The pre-commit husky hook is broken in this fresh worktree until `npm install` runs; use `--no-verify` on commits until Task 1 completes the install.

---

## File Structure

**New package `packages/mediabunny/`:**
- `package.json` — package manifest, depends on `mediabunny` + `@wordpress/worker-threads`
- `tsconfig.json` — project references config
- `.npmrc`, `.gitignore` — standard scaffolding (`.gitignore` ignores generated `src/worker-code.ts`)
- `README.md`, `CHANGELOG.md` — package docs
- `src/types.ts` — `export type ItemId = string;`
- `src/index.ts` — **core pipeline**: `convertGifToVideo`, `cancelOperations`
- `src/worker.ts` — `expose()` the API in the worker context
- `src/mediabunny-worker.ts` — main-thread side: lazy `Worker` via Blob URL, `wrap()` the API
- `src/loader.ts` — script-module discovery shim

**Modified in `packages/upload-media/`:**
- `src/utils.ts` — add `isAnimatedGif()`
- `src/store/types.ts` — add `OperationType.TranscodeGif`, `Settings.gifConvert`/`videoOutputFormat`, `OperationArgs[TranscodeGif]`
- `src/store/private-selectors.ts` — add `getActiveVideoProcessingCount`, `getPendingVideoProcessing`
- `src/store/private-actions.ts` — `prepareItem` hook, `transcodeGifItem` action, `processItem` concurrency, `finishOperation` re-trigger
- `src/store/utils/mediabunny.ts` — lazy dynamic-import wrapper (new)
- `tsconfig.json` — add `{ "path": "../mediabunny" }`

**Modified config/wiring:**
- `lib/client-assets.php` — enqueue `@wordpress/mediabunny/loader`
- `docs/manifest.json` — README manifest entry
- `tsconfig.json` (root) — add `{ "path": "packages/mediabunny" }`
- `test/unit/jest.config.js` + `test/unit/config/mediabunny-worker-code-stub.js` — jest mock for the worker module
- `test/e2e/specs/.../gif-to-video.spec.js` — e2e (new)

---

## Task 1: Scaffold the `@wordpress/mediabunny` package

**Files:**
- Create: `packages/mediabunny/package.json`
- Create: `packages/mediabunny/tsconfig.json`
- Create: `packages/mediabunny/.npmrc`
- Create: `packages/mediabunny/.gitignore`
- Create: `packages/mediabunny/README.md`
- Create: `packages/mediabunny/CHANGELOG.md`
- Create: `packages/mediabunny/src/types.ts`

- [ ] **Step 1: Create `packages/mediabunny/package.json`**

```json
{
	"name": "@wordpress/mediabunny",
	"version": "0.1.0",
	"description": "WebCodecs-based media wrapper for client-side video processing.",
	"author": "The WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress",
		"media",
		"mediabunny",
		"video"
	],
	"homepage": "https://github.com/WordPress/gutenberg/tree/HEAD/packages/mediabunny/README.md",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git",
		"directory": "packages/mediabunny"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"engines": {
		"node": ">=18.12.0",
		"npm": ">=8.19.2"
	},
	"files": [
		"src",
		"build-module",
		"build-types",
		"*.md"
	],
	"type": "module",
	"module": "build-module/index.mjs",
	"exports": {
		".": {
			"types": "./build-types/index.d.ts",
			"import": "./build-module/index.mjs"
		},
		"./worker": {
			"types": "./build-types/mediabunny-worker.d.ts",
			"import": "./build-module/mediabunny-worker.mjs"
		},
		"./package.json": "./package.json"
	},
	"wpWorkers": {
		"./worker": {
			"entry": "./src/worker.ts"
		}
	},
	"wpScriptModuleExports": {
		"./worker": "./build-module/mediabunny-worker.mjs",
		"./loader": "./build-module/loader.mjs"
	},
	"types": "build-types",
	"dependencies": {
		"@wordpress/worker-threads": "file:../worker-threads",
		"mediabunny": "^1.45.2"
	},
	"publishConfig": {
		"access": "public"
	}
}
```

Note: unlike `@wordpress/vips`/`@wordpress/ffmpeg`, `wpWorkers` has **no** `resolve` map — mediabunny is pure ESM with no WASM build variant.

- [ ] **Step 2: Create `packages/mediabunny/tsconfig.json`**

```json
{
	"$schema": "https://json.schemastore.org/tsconfig.json",
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"rootDir": "src",
		"declarationDir": "build-types"
	},
	"references": [ { "path": "../worker-threads" } ],
	"include": [ "src/**/*" ],
	"exclude": [ "src/test/**" ]
}
```

- [ ] **Step 3: Create `packages/mediabunny/.npmrc`**

```
package-lock=false
```

- [ ] **Step 4: Create `packages/mediabunny/.gitignore`**

```
# Auto-generated worker code for inline Blob URL creation.
# The build process generates a placeholder if needed, then overwrites it with real content.
src/worker-code.ts
```

- [ ] **Step 5: Create `packages/mediabunny/README.md`**

```markdown
# Mediabunny

WebCodecs-based media wrapper for client-side video processing in WordPress.

Used by `@wordpress/upload-media` to convert animated GIFs to MP4/WebM videos
during upload, dramatically reducing file sizes while preserving the GIF-like
playback experience.

## Usage

This package is not meant to be used directly. It is loaded lazily by
`@wordpress/upload-media` when an animated GIF is detected in the upload queue.

GIF frames are decoded with the browser's `ImageDecoder` and re-encoded with
the [mediabunny](https://mediabunny.dev/) library, which delegates encoding to
the native WebCodecs API. All work runs in a Web Worker, keeping the main
thread free.

## Installation

Install the module:

\`\`\`bash
npm install @wordpress/mediabunny
\`\`\`

## Requirements

-   WebCodecs support (`ImageDecoder`, `VideoEncoder`)
-   Web Workers support
```

- [ ] **Step 6: Create `packages/mediabunny/CHANGELOG.md`**

```markdown
<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Initial release. Provides a WebCodecs/mediabunny wrapper for animated GIF to video (MP4/WebM) conversion.
```

- [ ] **Step 7: Create `packages/mediabunny/src/types.ts`**

```typescript
export type ItemId = string;
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: completes without errors; `node_modules/mediabunny` exists and `node_modules/@wordpress/mediabunny` symlinks to `packages/mediabunny`. This also repairs the husky pre-commit hook.

- [ ] **Step 9: Lock the exact mediabunny API surface**

Run: `cat node_modules/mediabunny/package.json | grep '"version"'` and inspect the type definitions:
Run: `ls node_modules/mediabunny/dist/ && grep -RnoE 'export (declare )?(class|const|function) (Output|BufferTarget|Mp4OutputFormat|WebMOutputFormat|WebmOutputFormat|VideoSampleSource|VideoSample|QUALITY_HIGH|canEncodeVideo)' node_modules/mediabunny/dist/*.d.ts`
Expected: confirms the exact exported symbol names and signatures. **Record any names that differ from those used in Task 3** (e.g. `WebMOutputFormat` vs `WebmOutputFormat`, the `VideoSample` constructor signature, `VideoSampleSource` options, whether a `canEncodeVideo` helper exists) and use the confirmed names in Task 3.

- [ ] **Step 10: Commit**

```bash
git add packages/mediabunny package.json package-lock.json
git commit -m "Mediabunny: Scaffold @wordpress/mediabunny package"
```

---

## Task 2: `isAnimatedGif()` detection utility

**Files:**
- Modify: `packages/upload-media/src/utils.ts` (append)
- Test: `packages/upload-media/src/test/is-animated-gif.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/upload-media/src/test/is-animated-gif.ts`:

```typescript
/**
 * Internal dependencies
 */
import { isAnimatedGif } from '../utils';

/**
 * Builds a minimal GIF buffer.
 *
 * @param frameExtensions Number of Graphic Control Extension blocks to embed.
 * @return ArrayBuffer of a synthetic GIF.
 */
function buildGif( frameExtensions: number ): ArrayBuffer {
	// Header "GIF8" + "9a".
	const bytes: number[] = [ 0x47, 0x49, 0x46, 0x38, 0x39, 0x61 ];
	for ( let i = 0; i < frameExtensions; i++ ) {
		// Block Terminator, Extension Introducer, Graphic Control Label.
		bytes.push( 0x00, 0x21, 0xf9 );
	}
	return new Uint8Array( bytes ).buffer;
}

describe( 'isAnimatedGif', () => {
	it( 'returns false for a non-GIF buffer', () => {
		expect(
			isAnimatedGif( new Uint8Array( [ 0x89, 0x50, 0x4e, 0x47 ] ).buffer )
		).toBe( false );
	} );

	it( 'returns false for a buffer shorter than the magic bytes', () => {
		expect( isAnimatedGif( new Uint8Array( [ 0x47 ] ).buffer ) ).toBe(
			false
		);
	} );

	it( 'returns false for a single-frame (static) GIF', () => {
		expect( isAnimatedGif( buildGif( 1 ) ) ).toBe( false );
	} );

	it( 'returns true for a multi-frame (animated) GIF', () => {
		expect( isAnimatedGif( buildGif( 2 ) ) ).toBe( true );
	} );
} );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- packages/upload-media/src/test/is-animated-gif.ts`
Expected: FAIL — `isAnimatedGif` is not exported from `../utils`.

- [ ] **Step 3: Implement `isAnimatedGif()`**

Append to `packages/upload-media/src/utils.ts`:

```typescript

/**
 * Detects whether a file buffer contains an animated GIF.
 *
 * Performs binary analysis of the GIF file structure:
 * 1. Checks for the GIF magic bytes ("GIF8")
 * 2. Counts frame blocks by scanning for Graphic Control Extension headers
 *    (Block Terminator 0x00 + Extension Introducer 0x21 + Graphic Control Label 0xF9)
 * 3. Returns true if more than 1 frame is found
 *
 * Based on the GIF specification:
 *
 * @see http://www.matthewflickinger.com/lab/whatsinagif/
 *
 * @param buffer File ArrayBuffer.
 * @return Whether the buffer contains an animated GIF.
 */
export function isAnimatedGif( buffer: ArrayBuffer ): boolean {
	const view = new Uint8Array( buffer );

	// Check GIF magic bytes: "GIF8" (0x47 0x49 0x46 0x38).
	if (
		view.length < 4 ||
		view[ 0 ] !== 0x47 ||
		view[ 1 ] !== 0x49 ||
		view[ 2 ] !== 0x46 ||
		view[ 3 ] !== 0x38
	) {
		return false;
	}

	// Count frames by looking for Graphic Control Extension headers.
	// Pattern: Block Terminator (0x00) + Extension Introducer (0x21) + Graphic Control Label (0xF9).
	let frameCount = 0;
	for ( let i = 0; i < view.length - 2; i++ ) {
		if (
			view[ i ] === 0x00 &&
			view[ i + 1 ] === 0x21 &&
			view[ i + 2 ] === 0xf9
		) {
			frameCount++;
			if ( frameCount > 1 ) {
				return true;
			}
		}
	}

	return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- packages/upload-media/src/test/is-animated-gif.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/upload-media/src/utils.ts packages/upload-media/src/test/is-animated-gif.ts
git commit -m "Upload Media: Add isAnimatedGif() detection utility"
```

---

## Task 3: Core conversion pipeline (`src/index.ts`)

**Files:**
- Create: `packages/mediabunny/src/index.ts`
- Test: `packages/mediabunny/src/test/index.ts` (create)

> Use the exact mediabunny symbol names confirmed in Task 1 Step 9. The code below uses the documented v1.45.2 names; if the installed types differ, substitute the confirmed names consistently in both `index.ts` and the test.

- [ ] **Step 1: Write the failing test**

Create `packages/mediabunny/src/test/index.ts`:

```typescript
/**
 * Internal dependencies
 */
import { convertGifToVideo, cancelOperations } from '../index';

// Minimal fake VideoFrame.
class FakeVideoFrame {
	duration = 100000; // microseconds
	timestamp = 0;
	closed = false;
	close() {
		this.closed = true;
	}
}

// Mock the browser ImageDecoder.
class FakeImageDecoder {
	completed = Promise.resolve();
	tracks = { selectedTrack: { frameCount: 3 } };
	constructor( public init: { data: ArrayBuffer; type: string } ) {}
	async decode( { frameIndex }: { frameIndex: number } ) {
		const image = new FakeVideoFrame();
		image.timestamp = frameIndex * 100000;
		return { image };
	}
	close() {}
}

// Mock mediabunny.
const addedSamples: unknown[] = [];
jest.mock( 'mediabunny', () => ( {
	Output: class {
		target = { buffer: new Uint8Array( [ 1, 2, 3 ] ).buffer };
		addVideoTrack() {}
		async start() {}
		async finalize() {}
	},
	BufferTarget: class {},
	Mp4OutputFormat: class {},
	WebMOutputFormat: class {},
	VideoSampleSource: class {
		async add( sample: unknown ) {
			addedSamples.push( sample );
		}
	},
	VideoSample: class {
		constructor( public frame: unknown, public opts: unknown ) {}
	},
	QUALITY_HIGH: 'quality-high',
} ) );

beforeEach( () => {
	addedSamples.length = 0;
	( globalThis as Record< string, unknown > ).ImageDecoder =
		FakeImageDecoder;
	( globalThis as Record< string, unknown > ).VideoEncoder = {
		isConfigSupported: jest
			.fn()
			.mockResolvedValue( { supported: true } ),
	};
} );

describe( 'convertGifToVideo', () => {
	it( 'decodes every GIF frame and returns an ArrayBuffer', async () => {
		const result = await convertGifToVideo(
			'item-1',
			new Uint8Array( [ 0x47, 0x49, 0x46, 0x38 ] ).buffer,
			'video/mp4'
		);
		expect( result ).toBeInstanceOf( ArrayBuffer );
		expect( addedSamples ).toHaveLength( 3 );
	} );

	it( 'throws "Operation cancelled" when cancelled before encoding', async () => {
		const promise = convertGifToVideo(
			'item-2',
			new Uint8Array( [ 0x47, 0x49, 0x46, 0x38 ] ).buffer,
			'video/mp4'
		);
		await cancelOperations( 'item-2' );
		await expect( promise ).rejects.toThrow();
	} );

	it( 'throws when the encoder config is unsupported', async () => {
		( globalThis as Record< string, unknown > ).VideoEncoder = {
			isConfigSupported: jest
				.fn()
				.mockResolvedValue( { supported: false } ),
		};
		await expect(
			convertGifToVideo(
				'item-3',
				new Uint8Array( [ 0x47, 0x49, 0x46, 0x38 ] ).buffer,
				'video/mp4'
			)
		).rejects.toThrow( 'Unsupported' );
	} );
} );
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- packages/mediabunny/src/test/index.ts`
Expected: FAIL — `../index` has no `convertGifToVideo` export.

- [ ] **Step 3: Implement `packages/mediabunny/src/index.ts`**

```typescript
/**
 * External dependencies
 */
import {
	Output,
	BufferTarget,
	Mp4OutputFormat,
	WebMOutputFormat,
	VideoSampleSource,
	VideoSample,
	QUALITY_HIGH,
} from 'mediabunny';

/**
 * Internal dependencies
 */
import type { ItemId } from './types';

/**
 * Tracks in-progress operations so they can be cancelled at async boundaries.
 */
const inProgressOperations = new Set< ItemId >();

/**
 * Serializes encoder access. Multiple concurrent WebCodecs encodes are
 * memory-heavy; the upload-media concurrency limit already caps this at 1,
 * but the lock guards direct callers too.
 */
let operationLock: Promise< void > = Promise.resolve();

/**
 * Cancels all ongoing operations for a given item ID.
 *
 * Cancellation takes effect at async boundaries (waiting for the lock,
 * decoder completion, between frames).
 *
 * @param id Item ID.
 * @return Whether an operation was cancelled.
 */
export async function cancelOperations( id: ItemId ): Promise< boolean > {
	return inProgressOperations.delete( id );
}

/**
 * Pads a dimension up to the nearest even number (encoder requirement).
 *
 * @param value Dimension value.
 * @return Even dimension value.
 */
function padToEven( value: number ): number {
	return value % 2 === 0 ? value : value + 1;
}

/**
 * Converts an animated GIF to a video file (MP4 or WebM).
 *
 * Decodes GIF frames via the browser ImageDecoder (honoring per-frame
 * delays) and re-encodes them with mediabunny / WebCodecs.
 *
 * @param id             Item ID.
 * @param buffer         GIF file buffer.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Encoded video buffer.
 */
export async function convertGifToVideo(
	id: ItemId,
	buffer: ArrayBuffer,
	outputMimeType: string,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	inProgressOperations.add( id );

	const previousLock = operationLock;
	let releaseLock: () => void;
	operationLock = new Promise< void >( ( resolve ) => {
		releaseLock = resolve;
	} );

	try {
		await previousLock;

		if ( ! inProgressOperations.has( id ) ) {
			throw new Error( 'Operation cancelled' );
		}

		if (
			typeof ImageDecoder === 'undefined' ||
			typeof VideoEncoder === 'undefined'
		) {
			throw new Error( 'Unsupported: WebCodecs unavailable' );
		}

		const isWebm = outputMimeType === 'video/webm';
		const codec = isWebm ? 'vp9' : 'avc';

		const support = await VideoEncoder.isConfigSupported( {
			codec: isWebm ? 'vp09.00.10.08' : 'avc1.42001f',
			width: 2,
			height: 2,
		} );
		if ( ! support?.supported ) {
			throw new Error( 'Unsupported: encoder config not supported' );
		}

		const decoder = new ImageDecoder( {
			data: buffer,
			type: 'image/gif',
		} );
		await decoder.completed;

		if ( ! inProgressOperations.has( id ) ) {
			decoder.close();
			throw new Error( 'Operation cancelled' );
		}

		const track = decoder.tracks.selectedTrack;
		const frameCount = track?.frameCount ?? 0;
		if ( frameCount === 0 ) {
			decoder.close();
			throw new Error( 'GIF contains no decodable frames' );
		}

		const source = new VideoSampleSource( {
			codec,
			bitrate: QUALITY_HIGH,
		} );
		const output = new Output( {
			format: isWebm
				? new WebMOutputFormat()
				: new Mp4OutputFormat(),
			target: new BufferTarget(),
		} );
		output.addVideoTrack( source );
		await output.start();

		let timestamp = 0;
		for ( let i = 0; i < frameCount; i++ ) {
			if ( ! inProgressOperations.has( id ) ) {
				decoder.close();
				throw new Error( 'Operation cancelled' );
			}

			const { image } = await decoder.decode( { frameIndex: i } );
			// ImageDecoder durations are in microseconds; default to ~100ms
			// when a frame omits its delay (matches browser GIF behavior).
			const duration = image.duration ?? 100000;

			let frameForEncode: VideoFrame = image;
			if (
				maxDimensions &&
				( image.displayWidth > maxDimensions ||
					image.displayHeight > maxDimensions )
			) {
				const scale = Math.min(
					maxDimensions / image.displayWidth,
					maxDimensions / image.displayHeight
				);
				const targetW = padToEven(
					Math.round( image.displayWidth * scale )
				);
				const targetH = padToEven(
					Math.round( image.displayHeight * scale )
				);
				const canvas = new OffscreenCanvas( targetW, targetH );
				const ctx = canvas.getContext(
					'2d'
				) as OffscreenCanvasRenderingContext2D;
				ctx.drawImage( image, 0, 0, targetW, targetH );
				frameForEncode = new VideoFrame( canvas, {
					timestamp,
					duration,
				} );
				image.close();
			}

			await source.add(
				new VideoSample( frameForEncode, { timestamp, duration } )
			);
			frameForEncode.close();
			timestamp += duration;
		}

		decoder.close();
		await output.finalize();

		const out = output.target.buffer;
		if ( ! out || out.byteLength === 0 ) {
			throw new Error( 'Encoder produced empty output' );
		}
		return out;
	} finally {
		inProgressOperations.delete( id );
		releaseLock!();
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- packages/mediabunny/src/test/index.ts`
Expected: PASS — all 3 tests green. If a mediabunny symbol name differs, reconcile `index.ts`, the test mock, and the Task 1 Step 9 notes, then re-run.

- [ ] **Step 5: Typecheck the package**

Run: `npx tsc --build packages/mediabunny/tsconfig.json`
Expected: no errors. If WebCodecs DOM lib types (`ImageDecoder`, `VideoFrame`, `OffscreenCanvas`) are missing, confirm `tsconfig.base.json` includes the `DOM` lib (it does for the monorepo); if `ImageDecoder` is still unresolved, add a minimal ambient declaration in `src/types.ts` for `ImageDecoder` only (do not redeclare `VideoFrame`/`OffscreenCanvas`).

- [ ] **Step 6: Commit**

```bash
git add packages/mediabunny/src/index.ts packages/mediabunny/src/test/index.ts
git commit -m "Mediabunny: Implement ImageDecoder -> mediabunny GIF-to-video pipeline"
```

---

## Task 4: Worker plumbing (worker entry, main-thread wrapper, loader)

**Files:**
- Create: `packages/mediabunny/src/worker.ts`
- Create: `packages/mediabunny/src/mediabunny-worker.ts`
- Create: `packages/mediabunny/src/loader.ts`

- [ ] **Step 1: Create `packages/mediabunny/src/worker.ts`**

```typescript
/**
 * Worker entry point for mediabunny video processing.
 *
 * Exposes the conversion API in the Web Worker context. The
 * @wordpress/worker-threads library handles RPC with the main thread.
 */

/**
 * External dependencies
 */
import { expose } from '@wordpress/worker-threads';

/**
 * Internal dependencies
 */
import { cancelOperations, convertGifToVideo } from './index';

/**
 * The API object exposed to the main thread.
 */
const api = {
	cancelOperations,
	convertGifToVideo,
};

expose( api );

/**
 * Type export for use with wrap() on the main thread.
 */
export type WorkerAPI = typeof api;
```

- [ ] **Step 2: Create `packages/mediabunny/src/mediabunny-worker.ts`**

```typescript
/**
 * External dependencies
 */
import { wrap, terminate, type Remote } from '@wordpress/worker-threads';

/**
 * Internal dependencies
 */
import type { ItemId } from './types';
import type { WorkerAPI } from './worker';
import { workerCode } from './worker-code';

/**
 * The worker instance, lazily created on first use.
 */
let worker: Worker | undefined;

/**
 * The wrapped worker API for RPC calls.
 */
let workerAPI: Remote< WorkerAPI > | undefined;

/**
 * The Blob URL for the worker, kept for cleanup.
 */
let workerBlobUrl: string | undefined;

/**
 * Gets or creates the mediabunny worker instance.
 *
 * The worker code is bundled inline and loaded via a Blob URL so it works
 * regardless of how the consuming bundle is built.
 *
 * @return The wrapped worker API.
 */
function getWorkerAPI(): Remote< WorkerAPI > {
	if ( workerAPI === undefined ) {
		const blob = new Blob( [ workerCode ], {
			type: 'application/javascript',
		} );
		workerBlobUrl = URL.createObjectURL( blob );
		worker = new Worker( workerBlobUrl, { type: 'module' } );
		workerAPI = wrap< WorkerAPI >( worker );
	}
	return workerAPI;
}

/**
 * Converts an animated GIF to a video file using mediabunny in a worker.
 *
 * @param id             Item ID.
 * @param buffer         GIF file buffer.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Video file buffer.
 */
export async function mediabunnyConvertGifToVideo(
	id: ItemId,
	buffer: ArrayBuffer,
	outputMimeType: string,
	maxDimensions?: number
): Promise< ArrayBuffer > {
	const api = getWorkerAPI();
	return api.convertGifToVideo( id, buffer, outputMimeType, maxDimensions );
}

/**
 * Cancels all ongoing operations for the given item.
 *
 * @param id Item ID.
 * @return Whether an operation was cancelled.
 */
export async function mediabunnyCancelOperations(
	id: ItemId
): Promise< boolean > {
	const api = getWorkerAPI();
	return api.cancelOperations( id );
}

/**
 * Terminates the mediabunny worker if it exists.
 */
export function terminateMediabunnyWorker(): void {
	if ( workerAPI ) {
		terminate( workerAPI );
		workerAPI = undefined;
		worker = undefined;
	}
	if ( workerBlobUrl ) {
		URL.revokeObjectURL( workerBlobUrl );
		workerBlobUrl = undefined;
	}
}
```

- [ ] **Step 3: Create `packages/mediabunny/src/loader.ts`**

```typescript
/**
 * Loader for the @wordpress/mediabunny/worker module.
 *
 * This tiny module exists so that WordPress can discover
 * @wordpress/mediabunny/worker as a dynamic module dependency and include it
 * in the import map. Without this, the dynamic import() call in
 * @wordpress/upload-media's IIFE bundle cannot resolve the module URL at
 * runtime.
 *
 * The loader is enqueued on block editor pages via wp_enqueue_script_module()
 * in lib/client-assets.php. The worker module is only fetched when
 * GIF-to-video conversion is actually triggered.
 *
 * @see packages/upload-media/src/store/utils/mediabunny.ts — the consumer
 * @see packages/vips/src/loader.ts — the reference pattern
 */
export default function loader() {
	return import( '@wordpress/mediabunny/worker' );
}
```

- [ ] **Step 4: Create the gitignored placeholder so typecheck resolves `./worker-code`**

Run: `printf 'export const workerCode = %s;\n' "''" > packages/mediabunny/src/worker-code.ts`
Expected: file created. It is gitignored (Task 1 Step 4); the real content is generated by `npm run build`. This placeholder only lets `tsc`/jest resolve the import.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --build packages/mediabunny/tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/mediabunny/src/worker.ts packages/mediabunny/src/mediabunny-worker.ts packages/mediabunny/src/loader.ts
git commit -m "Mediabunny: Add worker entry, main-thread wrapper, and loader"
```

---

## Task 5: upload-media store types, selectors, and lazy wrapper

**Files:**
- Modify: `packages/upload-media/src/store/types.ts`
- Modify: `packages/upload-media/src/store/private-selectors.ts`
- Create: `packages/upload-media/src/store/utils/mediabunny.ts`
- Test: `packages/upload-media/src/store/test/selectors.ts` (extend existing)

- [ ] **Step 1: Extend `Settings`, `OperationType`, and `OperationArgs` in `packages/upload-media/src/store/types.ts`**

In the `Settings` interface, after the `mediaFinalize?` line, add:

```typescript
	// Whether to convert animated GIFs to video (MP4/WebM) during upload.
	// When enabled, animated GIFs are transcoded to video for smaller file sizes.
	// Default is true.
	gifConvert?: boolean;
	// Output format for GIF-to-video conversion.
	// Accepts 'video/mp4' or 'video/webm'. Default is 'video/mp4'.
	videoOutputFormat?: 'video/mp4' | 'video/webm';
```

In the `OperationType` enum, after the `TranscodeImage` line, add:

```typescript
	TranscodeGif = 'TRANSCODE_GIF',
```

In the `OperationArgs` interface, after the `TranscodeImage` entry's closing `};`, add:

```typescript
	[ OperationType.TranscodeGif ]: {
		/** Video output format: 'mp4' or 'webm'. */
		outputFormat: 'mp4' | 'webm';
	};
```

- [ ] **Step 2: Write the failing selector test**

Append to `packages/upload-media/src/store/test/selectors.ts` (inside the existing top-level `describe`, after the last selector block — adjust the import if `getActiveVideoProcessingCount`/`getPendingVideoProcessing` are not yet exported):

```typescript
describe( 'video processing selectors', () => {
	it( 'getActiveVideoProcessingCount counts items transcoding a GIF', () => {
		const state = {
			queue: [
				{ currentOperation: OperationType.TranscodeGif },
				{ currentOperation: OperationType.Upload },
				{ currentOperation: OperationType.TranscodeGif },
			],
		} as never;
		expect(
			privateSelectors.getActiveVideoProcessingCount( state )
		).toBe( 2 );
	} );

	it( 'getPendingVideoProcessing returns items whose next op is TranscodeGif', () => {
		const state = {
			queue: [
				{
					operations: [ OperationType.TranscodeGif ],
					currentOperation: undefined,
				},
				{
					operations: [ OperationType.Upload ],
					currentOperation: undefined,
				},
			],
		} as never;
		expect(
			privateSelectors.getPendingVideoProcessing( state )
		).toHaveLength( 1 );
	} );
} );
```

> If `selectors.ts` does not already import `privateSelectors`/`OperationType`, add: `import * as privateSelectors from '../private-selectors';` and `import { OperationType } from '../types';` at the top with the other internal imports.

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit -- packages/upload-media/src/store/test/selectors.ts`
Expected: FAIL — `getActiveVideoProcessingCount` / `getPendingVideoProcessing` are undefined.

- [ ] **Step 4: Implement the selectors in `packages/upload-media/src/store/private-selectors.ts`**

After `getActiveImageProcessingCount`, add:

```typescript
/**
 * Returns the number of items currently performing video processing operations.
 *
 * This counts items whose current operation is TranscodeGif,
 * used to enforce the video processing concurrency limit (1 at a time).
 *
 * @param state Upload state.
 *
 * @return Number of items currently processing video.
 */
export function getActiveVideoProcessingCount( state: State ): number {
	return state.queue.filter(
		( item ) => item.currentOperation === OperationType.TranscodeGif
	).length;
}
```

After `getPendingImageProcessing`, add:

```typescript
/**
 * Returns items waiting for video processing (next operation is TranscodeGif
 * but not yet started).
 *
 * @param state Upload state.
 *
 * @return Items pending video processing.
 */
export function getPendingVideoProcessing( state: State ): QueueItem[] {
	return state.queue.filter( ( item ) => {
		const nextOperation = Array.isArray( item.operations?.[ 0 ] )
			? item.operations[ 0 ][ 0 ]
			: item.operations?.[ 0 ];
		return (
			nextOperation === OperationType.TranscodeGif &&
			item.currentOperation !== OperationType.TranscodeGif
		);
	} );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit -- packages/upload-media/src/store/test/selectors.ts`
Expected: PASS — both new tests green.

- [ ] **Step 6: Create the lazy wrapper `packages/upload-media/src/store/utils/mediabunny.ts`**

```typescript
/**
 * Internal dependencies
 */
import { getFileBasename } from '../../utils';
import type { QueueItemId } from '../types';

/**
 * Cached dynamic import promise for @wordpress/mediabunny/worker.
 *
 * Using a dynamic import keeps the worker module out of the main bundle; it
 * is fetched only when GIF-to-video conversion is actually triggered.
 */
let mediabunnyModulePromise:
	| Promise< typeof import('@wordpress/mediabunny/worker') >
	| undefined;

/**
 * The resolved module reference, available synchronously after first load.
 */
let mediabunnyModule:
	| typeof import('@wordpress/mediabunny/worker')
	| undefined;

/**
 * Lazily loads and caches the @wordpress/mediabunny/worker module.
 *
 * @return The mediabunny worker module.
 */
function loadMediabunnyModule(): Promise<
	typeof import('@wordpress/mediabunny/worker')
> {
	if ( ! mediabunnyModulePromise ) {
		mediabunnyModulePromise = import(
			'@wordpress/mediabunny/worker'
		).then( ( mod ) => {
			mediabunnyModule = mod;
			return mod;
		} );
	}
	return mediabunnyModulePromise;
}

/**
 * Converts an animated GIF to a video file using mediabunny in a web worker.
 *
 * @param id             Queue item ID.
 * @param file           GIF file object.
 * @param outputMimeType Output MIME type ('video/mp4' or 'video/webm').
 * @param maxDimensions  Optional maximum dimension for downscaling.
 * @return Converted video file.
 */
export async function mediabunnyConvertGifToVideo(
	id: QueueItemId,
	file: File,
	outputMimeType: string,
	maxDimensions?: number
) {
	const { mediabunnyConvertGifToVideo: convert } =
		await loadMediabunnyModule();
	const buffer = await convert(
		id,
		await file.arrayBuffer(),
		outputMimeType,
		maxDimensions
	);

	const ext = outputMimeType === 'video/webm' ? 'webm' : 'mp4';
	const fileName = `${ getFileBasename( file.name ) }.${ ext }`;
	return new File(
		[ new Blob( [ buffer as ArrayBuffer ], { type: outputMimeType } ) ],
		fileName,
		{ type: outputMimeType }
	);
}

/**
 * Cancels all ongoing mediabunny operations for the given item.
 *
 * @param id Queue item ID to cancel operations for.
 * @return Whether any operation was cancelled.
 */
export async function mediabunnyCancelOperations( id: QueueItemId ) {
	if ( ! mediabunnyModule ) {
		return false;
	}
	return mediabunnyModule.mediabunnyCancelOperations( id );
}

/**
 * Terminates the mediabunny worker if it has been loaded.
 */
export function terminateMediabunnyWorker(): void {
	if ( mediabunnyModule ) {
		mediabunnyModule.terminateMediabunnyWorker();
	}
}
```

- [ ] **Step 7: Add the project reference in `packages/upload-media/tsconfig.json`**

In the `references` array, add (keep alphabetical-ish grouping near `../data`):

```json
		{ "path": "../mediabunny" },
```

- [ ] **Step 8: Commit**

```bash
git add packages/upload-media/src/store/types.ts packages/upload-media/src/store/private-selectors.ts packages/upload-media/src/store/utils/mediabunny.ts packages/upload-media/src/store/test/selectors.ts packages/upload-media/tsconfig.json
git commit -m "Upload Media: Add GIF transcode types, selectors, and mediabunny wrapper"
```

---

## Task 6: prepareItem hook, transcodeGifItem action, processItem concurrency

**Files:**
- Modify: `packages/upload-media/src/store/private-actions.ts`
- Test: `packages/upload-media/src/store/test/private-actions.js` (extend existing)

- [ ] **Step 1: Write the failing test**

Append a new `describe` to `packages/upload-media/src/store/test/private-actions.js`. (Mirror the existing file's setup helpers — it already constructs a registry/store; reuse the same `createRegistryWithStores`/dispatch helpers used by sibling tests in this file.)

```javascript
describe( 'prepareItem - animated GIF', () => {
	beforeEach( () => {
		global.ImageDecoder = function () {};
		global.VideoEncoder = function () {};
	} );
	afterEach( () => {
		delete global.ImageDecoder;
		delete global.VideoEncoder;
	} );

	it( 'enqueues TranscodeGif for an animated GIF when gifConvert is on', async () => {
		const registry = createRegistryWithStores();
		// 6-byte header + two Graphic Control Extension blocks => animated.
		const gifBytes = new Uint8Array( [
			0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x21, 0xf9, 0x00, 0x21,
			0xf9,
		] );
		const file = new File( [ gifBytes ], 'test.gif', {
			type: 'image/gif',
		} );
		const id = '1';
		registry
			.dispatch( uploadStore )
			.addItemFromFile( { file, onChange() {} } );

		await registry.dispatch( uploadStore ).prepareItem( id );

		const item = registry.select( uploadStore ).getItem( id );
		const ops = item.operations.map( ( op ) =>
			Array.isArray( op ) ? op[ 0 ] : op
		);
		expect( ops ).toContain( OperationType.TranscodeGif );
	} );

	it( 'does not enqueue TranscodeGif when WebCodecs is unavailable', async () => {
		delete global.ImageDecoder;
		const registry = createRegistryWithStores();
		const gifBytes = new Uint8Array( [
			0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x21, 0xf9, 0x00, 0x21,
			0xf9,
		] );
		const file = new File( [ gifBytes ], 'test.gif', {
			type: 'image/gif',
		} );
		const id = '1';
		registry
			.dispatch( uploadStore )
			.addItemFromFile( { file, onChange() {} } );

		await registry.dispatch( uploadStore ).prepareItem( id );

		const item = registry.select( uploadStore ).getItem( id );
		const ops = item.operations.map( ( op ) =>
			Array.isArray( op ) ? op[ 0 ] : op
		);
		expect( ops ).not.toContain( OperationType.TranscodeGif );
	} );
} );
```

> If the existing test file uses different helper/import names, match them exactly — read the top of `private-actions.js` first and reuse its `uploadStore`, `OperationType`, and registry-setup imports rather than inventing new ones.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- packages/upload-media/src/store/test/private-actions.js -t "animated GIF"`
Expected: FAIL — no `TranscodeGif` operation is enqueued (hook not implemented).

- [ ] **Step 3: Wire imports in `packages/upload-media/src/store/private-actions.ts`**

Change the `../utils` import to include `isAnimatedGif`:

```typescript
import {
	cloneFile,
	convertBlobToFile,
	isAnimatedGif,
	renameFile,
} from '../utils';
```

After the existing `import { ... } from './utils';` block, add:

```typescript
import { mediabunnyConvertGifToVideo } from './utils/mediabunny';
```

In the `ActionCreators` type, after `transcodeImageItem: typeof transcodeImageItem;`, add:

```typescript
	transcodeGifItem: typeof transcodeGifItem;
```

- [ ] **Step 4: Add the concurrency gate and dispatch case in `processItem`**

In `processItem`, before the `if ( attachment ) {` block (mirroring #76946 line ~318), add:

```typescript
		/*
		 * GIF-to-video conversion is memory-intensive (WebCodecs encode).
		 * Limit to 1 concurrent transcoding operation.
		 */
		if ( operation === OperationType.TranscodeGif ) {
			const activeCount = select.getActiveVideoProcessingCount();
			if ( activeCount >= 1 ) {
				return;
			}
		}
```

In the `switch ( operation )` block, after the `case OperationType.TranscodeImage:` block, add:

```typescript
			case OperationType.TranscodeGif:
				dispatch.transcodeGifItem(
					item.id,
					operationArgs as OperationArgs[ OperationType.TranscodeGif ]
				);
				break;
```

- [ ] **Step 5: Re-trigger pending items in `finishOperation`**

In `finishOperation`, after the existing `previousOperation === OperationType.TranscodeImage` (image processing) re-trigger block, add:

```typescript
		/*
		 * If a video processing operation just finished, there may be items
		 * waiting due to the video processing concurrency limit.
		 */
		if ( previousOperation === OperationType.TranscodeGif ) {
			const pendingItems = select.getPendingVideoProcessing();
			for ( const pendingItem of pendingItems ) {
				dispatch.processItem( pendingItem.id );
			}
		}
```

- [ ] **Step 6: Add the GIF detection branch in `prepareItem`**

In `prepareItem`, after `const settings = select.getSettings();` and before the existing `const isImage = ...` line, add:

```typescript
		// Animated GIF → video conversion. WebCodecs is required; client-side
		// media already runs only under cross-origin isolation, so this is a
		// capability check, not a browser-support fallback path.
		if (
			file.type === 'image/gif' &&
			settings.gifConvert !== false &&
			typeof ImageDecoder !== 'undefined' &&
			typeof VideoEncoder !== 'undefined'
		) {
			const buffer = await file.arrayBuffer();
			if ( isAnimatedGif( buffer ) ) {
				const outputFormat =
					settings.videoOutputFormat === 'video/webm'
						? 'webm'
						: 'mp4';

				operations.push(
					[
						OperationType.TranscodeGif,
						{
							outputFormat,
						} as OperationArgs[ OperationType.TranscodeGif ],
					],
					OperationType.Upload
				);

				dispatch< AddOperationsAction >( {
					type: Type.AddOperations,
					id,
					operations,
				} );

				// Tell the server to handle sub-sizes since this is a video.
				dispatch.finishOperation( id, {
					additionalData: {
						...item.additionalData,
						generate_sub_sizes: true,
						convert_format: true,
					},
				} );
				return;
			}
		}
```

> Verify `operations`, `item`, `Type`, and `AddOperationsAction` are already in scope in `prepareItem` (they are in #76946's port — confirm against the current file and adjust the variable name if the local `prepareItem` builds its operations array under a different name).

- [ ] **Step 7: Add the `transcodeGifItem` action**

After the `transcodeImageItem` function (mirroring #76946 line ~1121), add:

```typescript
type TranscodeGifItemArgs = OperationArgs[ OperationType.TranscodeGif ];

/**
 * Converts an animated GIF to a video file (MP4 or WebM).
 *
 * Uses mediabunny + WebCodecs in a web worker for fully client-side
 * conversion. The resulting video replaces the original GIF in the queue.
 *
 * @param id     Item ID.
 * @param [args] Transcode arguments including output format.
 */
export function transcodeGifItem(
	id: QueueItemId,
	args?: TranscodeGifItemArgs
) {
	return async ( { select, dispatch }: ThunkArgs ) => {
		const item = select.getItem( id );
		if ( ! item ) {
			return;
		}

		const outputFormat = args?.outputFormat ?? 'mp4';
		const outputMimeType = `video/${ outputFormat }`;

		try {
			const file = await mediabunnyConvertGifToVideo(
				item.id,
				item.file,
				outputMimeType
			);

			const blobUrl = createBlobURL( file );
			dispatch< CacheBlobUrlAction >( {
				type: Type.CacheBlobUrl,
				id,
				blobUrl,
			} );

			dispatch.finishOperation( id, {
				file,
				attachment: {
					url: blobUrl,
				},
			} );
		} catch ( error ) {
			// An "Unsupported" outcome is a graceful skip, not a failure:
			// finish the operation untouched so the original GIF uploads
			// (matches the spec's non-error fallback contract).
			if (
				error instanceof Error &&
				error.message.startsWith( 'Unsupported' )
			) {
				dispatch.finishOperation( id, {} );
				return;
			}
			// Surface the real cause to the console; the user-facing
			// notification is intentionally generic.
			// eslint-disable-next-line no-console
			console.error(
				'[mediabunny] GIF→video conversion failed:',
				error
			);
			dispatch.cancelItem(
				id,
				new UploadError( {
					code: 'GIF_TRANSCODING_ERROR',
					message:
						'Animated GIF could not be converted to video',
					file: item.file,
					cause: error instanceof Error ? error : undefined,
				} )
			);
		}
	};
}
```

> `createBlobURL`, `CacheBlobUrlAction`, `UploadError`, `ThunkArgs`, `QueueItemId` are already imported in this file (they are used by `transcodeImageItem`). Do not re-import.

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test:unit -- packages/upload-media/src/store/test/private-actions.js -t "animated GIF"`
Expected: PASS — both new tests green.

- [ ] **Step 9: Run the full upload-media unit suite for regressions**

Run: `npm run test:unit -- packages/upload-media`
Expected: PASS — no existing tests broken.

- [ ] **Step 10: Commit**

```bash
git add packages/upload-media/src/store/private-actions.ts packages/upload-media/src/store/test/private-actions.js
git commit -m "Upload Media: Wire animated GIF -> video transcode via mediabunny"
```

---

## Task 7: Build, PHP, and test-config wiring

**Files:**
- Modify: `lib/client-assets.php`
- Modify: `docs/manifest.json`
- Modify: `tsconfig.json` (root)
- Create: `test/unit/config/mediabunny-worker-code-stub.js`
- Modify: `test/unit/jest.config.js`

- [ ] **Step 1: Enqueue the loader in `lib/client-assets.php`**

After the `gutenberg_enqueue_vips_loader()` function, add:

```php
/**
 * Enqueue the mediabunny loader script module in the block editor.
 *
 * This registers @wordpress/mediabunny/worker as a dynamic dependency in the
 * import map, enabling on-demand loading of the WebCodecs/mediabunny video
 * processing module when animated GIF-to-video conversion is triggered via
 * @wordpress/upload-media.
 *
 * @see packages/mediabunny/src/loader.ts
 */
if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
	add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_mediabunny_loader' );
}
function gutenberg_enqueue_mediabunny_loader() {
	wp_enqueue_script_module( '@wordpress/mediabunny/loader' );
}
```

- [ ] **Step 2: Add the docs manifest entry in `docs/manifest.json`**

Add this object immediately before the `@wordpress/media-utils` entry (keep the file's existing alphabetical-ish package ordering):

```json
	{
		"title": "@wordpress/mediabunny",
		"slug": "packages-mediabunny",
		"markdown_source": "../packages/mediabunny/README.md",
		"parent": "packages"
	},
```

- [ ] **Step 3: Add the project reference in root `tsconfig.json`**

In the `references` array, add in alphabetical position (after `packages/media-utils`, before `packages/notices` — match the file's existing order):

```json
		{ "path": "packages/mediabunny" },
```

- [ ] **Step 4: Create the jest worker stub `test/unit/config/mediabunny-worker-code-stub.js`**

```javascript
/**
 * Stub for the @wordpress/mediabunny/worker module.
 *
 * The real worker entry creates a Web Worker from generated worker-code, which
 * isn't runnable under jest. This stub supplies mock implementations so the
 * upload-media wrapper can be exercised in unit tests.
 *
 * Tests that need to customize behavior can use jest.mock() to override.
 */

const mediabunnyConvertGifToVideo = jest.fn();
const mediabunnyCancelOperations = jest.fn();
const terminateMediabunnyWorker = jest.fn();

module.exports = {
	mediabunnyConvertGifToVideo,
	mediabunnyCancelOperations,
	terminateMediabunnyWorker,
};
```

- [ ] **Step 5: Map the worker module in `test/unit/jest.config.js`**

In `moduleNameMapper`, after the `@wordpress/vips/worker` entry, add:

```javascript
		// Mock @wordpress/mediabunny/worker — the real worker creates a Web
		// Worker from generated code, which is unavailable in jest.
		'@wordpress/mediabunny/worker':
			'<rootDir>/test/unit/config/mediabunny-worker-code-stub.js',
```

- [ ] **Step 6: Verify build, typecheck, lint**

Run: `npm run build:packages 2>/dev/null || npm run build`
Expected: build completes; `packages/mediabunny/build-module/` is produced and `packages/mediabunny/src/worker-code.ts` is regenerated with real content.

Run: `npx tsc --build tsconfig.json`
Expected: no errors.

Run: `npm run lint:js -- packages/mediabunny packages/upload-media && npm run format -- packages/mediabunny packages/upload-media`
Expected: no lint errors; formatting clean.

Run: `vendor/bin/phpcs lib/client-assets.php`
Expected: no new PHP standards violations introduced by the added function.

- [ ] **Step 7: Commit**

```bash
git add lib/client-assets.php docs/manifest.json tsconfig.json test/unit/config/mediabunny-worker-code-stub.js test/unit/jest.config.js
git commit -m "Mediabunny: Wire build, PHP loader, docs manifest, and jest mock"
```

---

## Task 8: End-to-end test

**Files:**
- Create: `test/e2e/specs/editor/various/gif-to-video.spec.js`
- Reuse media fixture: confirm an animated GIF exists under `test/e2e/assets/` (e.g. `test/e2e/assets/`); if none, add a small animated GIF there as `test/e2e/assets/animated.gif`.

- [ ] **Step 1: Confirm or add the test fixture**

Run: `ls test/e2e/assets/ | grep -i gif || echo "no gif fixture"`
Expected: either an existing animated GIF fixture path, or add a small (<200 KB) animated GIF at `test/e2e/assets/animated.gif`. Verify it is animated: `node -e "const b=require('fs').readFileSync('test/e2e/assets/animated.gif');let n=0;for(let i=0;i<b.length-2;i++){if(b[i]===0&&b[i+1]===0x21&&b[i+2]===0xf9)n++;}console.log('frames:',n)"`
Expected: `frames:` value > 1.

- [ ] **Step 2: Write the e2e test**

Create `test/e2e/specs/editor/various/gif-to-video.spec.js`:

```javascript
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Animated GIF to video conversion', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'converts an animated GIF upload to a video attachment', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/image' } );

		const fileChooserPromise = page.waitForEvent( 'filechooser' );
		await page
			.getByRole( 'button', { name: 'Upload', exact: true } )
			.click();
		const fileChooser = await fileChooserPromise;
		await fileChooser.setFiles(
			require( 'path' ).resolve(
				process.cwd(),
				'test/e2e/assets/animated.gif'
			)
		);

		// After client-side conversion the image block transforms to a
		// video; assert a <video> element is rendered in the canvas.
		const video = editor.canvas.locator(
			'[data-type="core/video"] video, video'
		);
		await expect( video.first() ).toBeVisible( { timeout: 30000 } );
		await expect
			.poll( async () =>
				video.first().evaluate( ( el ) => el.currentSrc || el.src )
			)
			.toMatch( /\.(mp4|webm)$|blob:/ );
	} );
} );
```

> If the editor's GIF→video swap surfaces as a Video block vs. an Image block with a video source differs from the above selector, adjust the locator to match the actual rendered output observed when running the test the first time. The assertion intent — a playable video, not a GIF — must remain.

- [ ] **Step 3: Run the e2e test**

Run: `npm run wp-env start` (if not already running), then
Run: `npm run test:e2e -- test/e2e/specs/editor/various/gif-to-video.spec.js`
Expected: PASS — the uploaded animated GIF results in a video element. If it fails on the selector only (not the conversion), refine the locator per the note and re-run.

- [ ] **Step 4: Commit**

```bash
git add test/e2e/specs/editor/various/gif-to-video.spec.js test/e2e/assets/animated.gif
git commit -m "Mediabunny: Add e2e test for animated GIF to video conversion"
```

---

## Final verification

- [ ] **Step 1: Full lint + typecheck + targeted tests**

Run: `npm run lint:js -- packages/mediabunny packages/upload-media`
Run: `npx tsc --build tsconfig.json`
Run: `npm run test:unit -- packages/mediabunny packages/upload-media`
Expected: all green.

- [ ] **Step 2: Bundle-size sanity check (the headline differentiator)**

Run: `du -sh packages/mediabunny/build-module/ && ls -la packages/mediabunny/build-module/`
Expected: the mediabunny worker bundle is on the order of tens–hundreds of KB (no multi-MB WASM), versus #76946's ~14.1 MB. Record the measured size for the PR description's head-to-head comparison.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin add/gif-to-video-mediabunny
gh pr create --base trunk --title "Client-side media: Add animated GIF to video conversion via mediabunny" --body "Standalone alternative to #76946 (FFmpeg WASM). Uses the browser ImageDecoder + mediabunny/WebCodecs instead of inlined FFmpeg WASM. Wins: bundle size (measured vs ~14.1 MB) and hardware-accelerated encode performance. Honors real per-frame GIF delays. Spec: docs/superpowers/specs/2026-05-18-gif-to-video-mediabunny-design.md"
```

Expected: PR opened against `trunk` from `origin`. Link it in the #76946 comment thread for the head-to-head comparison.
