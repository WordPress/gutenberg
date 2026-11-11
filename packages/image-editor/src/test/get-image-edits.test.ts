/**
 * Compare `getImageEdits` with `createExportCamera` on the same image.
 * For each edit and output point, invert both paths to source coordinates
 * and allow less than one pixel of floating-point error. A single-axis
 * flip reverses the rotation angle because the camera rotates before
 * flipping while the mapped edits flip before rotating.
 *
 * This simulates the edit order in WordPress Core. It does not run the
 * server, which may edit a different source file and rounds crop pixels.
 */

import { describe, expect, it } from 'vitest';
import { mat2d, vec2 } from 'gl-matrix';
import { getImageEdits } from '../get-image-edits';
import { getOutputSize } from '../get-output-size';
import type { ImageEdit } from '../get-image-edits';
import { createExportCamera, getRotatedBBox } from '../core/camera';
import { DEFAULT_STATE } from '../core/constants';
import type { InternalImageEditorState, Size } from '../core/types';

const IMAGE: Size = { width: 1600, height: 900 };

function makeState(
	overrides: Partial< InternalImageEditorState > = {}
): InternalImageEditorState {
	return {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: IMAGE.width,
			naturalHeight: IMAGE.height,
		},
		...overrides,
	};
}

/**
 * Source pixel the editor draws at output position (u, v). Inverts the
 * export-camera matrix — the same one the preview uses — so whatever the
 * user sees on-screen is exactly what this returns.
 *
 * @param state      ImageEditorCanvas state (rotation/zoom/pan/flip/cropRect).
 * @param imageSize  Natural dimensions of the source image.
 * @param outputSize Output canvas dimensions the camera renders into.
 * @param u          Horizontal probe in [0, 1] across the output.
 * @param v          Vertical probe in [0, 1] across the output.
 */
function exportSourcePixel(
	state: InternalImageEditorState,
	imageSize: Size,
	outputSize: Size,
	u: number,
	v: number
): { x: number; y: number } {
	const camera = createExportCamera( state, imageSize, outputSize );
	const inv = mat2d.create();
	mat2d.invert( inv, camera );
	const out = vec2.create();
	vec2.transformMat2d(
		out,
		[ u * outputSize.width, v * outputSize.height ],
		inv
	);
	return { x: out[ 0 ], y: out[ 1 ] };
}

/**
 * Extract the pieces of the pipeline we need to simulate from the edits.
 * `flip` and `rotate` may be absent (identity-pruned), `crop` may also be
 * absent when the full-frame is framed; in that case the output canvas
 * equals the full rotated AABB.
 *
 * @param edits Ordered edits as emitted by `getImageEdits`.
 */
function readEdits( edits: ImageEdit[] ): {
	flip: { horizontal: boolean; vertical: boolean };
	rotation: number;
	crop: { x: number; y: number; width: number; height: number } | null;
} {
	const flip = { horizontal: false, vertical: false };
	let rotation = 0;
	let crop: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null = null;

	for ( const edit of edits ) {
		if ( edit.type === 'flip' ) {
			flip.horizontal = edit.horizontal;
			flip.vertical = edit.vertical;
		} else if ( edit.type === 'rotate' ) {
			rotation = edit.angle;
		} else if ( edit.type === 'crop' ) {
			crop = {
				x: edit.x,
				y: edit.y,
				width: edit.width,
				height: edit.height,
			};
		}
	}

	return { flip, rotation, crop };
}

/**
 * Source pixel the server lands on for output point (u, v). Simulates
 * Core's `[flip, rotate, crop]` pipeline in reverse:
 *   1. Output point o = (u · outW, v · outH).
 *   2. Canvas point c = o + (cropX, cropY) in the post-rotate full AABB.
 *   3. Undo rotation about the source center to reach the flipped frame.
 *   4. Undo flip about the source center.
 *
 * @param edits     Ordered edits the client sends.
 * @param imageSize Natural dimensions of the source image.
 * @param u         Horizontal probe in [0, 1] across the output.
 * @param v         Vertical probe in [0, 1] across the output.
 */
function serverSourcePixel(
	edits: ImageEdit[],
	imageSize: Size,
	u: number,
	v: number
): { x: number; y: number } {
	const { flip, rotation, crop } = readEdits( edits );

	const fullBBox = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		rotation
	);

	// Fractions → pixels in the full-AABB frame. When crop is absent the
	// output canvas is the full AABB itself.
	const cropW = crop ? crop.width * fullBBox.width : fullBBox.width;
	const cropH = crop ? crop.height * fullBBox.height : fullBBox.height;
	const cropX = crop ? crop.x * fullBBox.width : 0;
	const cropY = crop ? crop.y * fullBBox.height : 0;

	// Undo crop translation.
	const cx = u * cropW + cropX;
	const cy = v * cropH + cropY;

	// Undo rotation about source center. Core applies rotation to the
	// flipped source, so inverting rotation brings us back to the flipped
	// frame (source center at full-AABB center).
	const rad = ( rotation * Math.PI ) / 180;
	const cos = Math.cos( rad );
	const sin = Math.sin( rad );
	const dx = cx - fullBBox.width / 2;
	const dy = cy - fullBBox.height / 2;
	// gl-matrix mat2d.rotate: (x, y) → (x·cos - y·sin, x·sin + y·cos).
	// Inverse is the transpose: (x, y) → (x·cos + y·sin, -x·sin + y·cos).
	let fx = dx * cos + dy * sin + imageSize.width / 2;
	let fy = -dx * sin + dy * cos + imageSize.height / 2;

	// Undo flip about source center (flip is its own inverse).
	if ( flip.horizontal ) {
		fx = imageSize.width - fx;
	}
	if ( flip.vertical ) {
		fy = imageSize.height - fy;
	}

	return { x: fx, y: fy };
}

// Seven probe points — corners catch offset/scale drift, center catches
// uniform bugs, two asymmetric interior points catch cross-axis bugs
// that a center probe would miss.
const PROBES: { label: string; u: number; v: number }[] = [
	{ label: 'top-left', u: 0, v: 0 },
	{ label: 'top-right', u: 1, v: 0 },
	{ label: 'bottom-right', u: 1, v: 1 },
	{ label: 'bottom-left', u: 0, v: 1 },
	{ label: 'center', u: 0.5, v: 0.5 },
	{ label: 'interior-1', u: 0.3, v: 0.7 },
	{ label: 'interior-2', u: 0.8, v: 0.25 },
];

interface ParityRow {
	label: string;
	state: InternalImageEditorState;
	probeLabel: string;
	u: number;
	v: number;
}

function buildRows(): ParityRow[] {
	const rotations = [ 0, 15, 45, 60, 90, 135, 201, 270 ];
	const zooms = [ 1, 1.5, 2.5 ];
	const pans = [
		{ x: 0, y: 0 },
		{ x: 0.08, y: -0.05 },
		{ x: -0.1, y: 0.12 },
	];
	const flips = [
		{ horizontal: false, vertical: false },
		{ horizontal: true, vertical: false },
		{ horizontal: false, vertical: true },
		{ horizontal: true, vertical: true },
	];
	const cropRects = [
		{ label: 'full', rect: { x: 0, y: 0, width: 1, height: 1 } },
		{
			label: 'centered',
			rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		},
		{
			label: 'off-center',
			rect: { x: 0.1, y: 0.2, width: 0.45, height: 0.55 },
		},
	];

	const rows: ParityRow[] = [];
	for ( const rotation of rotations ) {
		for ( const zoom of zooms ) {
			for ( const pan of pans ) {
				for ( const flip of flips ) {
					for ( const { label: cropLabel, rect } of cropRects ) {
						const flipLabel = `${ flip.horizontal ? 'H' : '-' }${
							flip.vertical ? 'V' : '-'
						}`;
						const stateLabel = `rot=${ rotation } zoom=${ zoom } pan=(${ pan.x },${ pan.y }) flip=${ flipLabel } crop=${ cropLabel }`;
						const state = makeState( {
							rotation,
							zoom,
							pan,
							flip,
							cropRect: rect,
						} );
						for ( const { label: probeLabel, u, v } of PROBES ) {
							rows.push( {
								label: `${ stateLabel } probe=${ probeLabel }`,
								state,
								probeLabel,
								u,
								v,
							} );
						}
					}
				}
			}
		}
	}
	const subOneZoomState = makeState( {
		rotation: 19,
		zoom: 0.98,
		cropRect: { x: 0.48, y: 0, width: 0.04, height: 1 },
	} );
	for ( const { label: probeLabel, u, v } of PROBES ) {
		rows.push( {
			label: `fine-rotation sub-1 zoom probe=${ probeLabel }`,
			state: subOneZoomState,
			probeLabel,
			u,
			v,
		} );
	}
	return rows;
}

/**
 * Output size the server would produce, computed from the edits.
 * With a crop: the crop's pixel dims in the full-AABB frame. Without a
 * crop: the full rotated AABB.
 *
 * @param edits     Edits the server will apply.
 * @param imageSize Natural dimensions of the source image.
 */
function outputSizeFor( edits: ImageEdit[], imageSize: Size ): Size {
	const { rotation, crop } = readEdits( edits );
	const full = getRotatedBBox( imageSize.width, imageSize.height, rotation );
	if ( ! crop ) {
		return { width: full.width, height: full.height };
	}
	return {
		width: crop.width * full.width,
		height: crop.height * full.height,
	};
}

describe( 'getImageEdits ↔ Export-camera parity', () => {
	const rows = buildRows();

	for ( const { label, state, u, v } of rows ) {
		it( label, () => {
			const edits = getImageEdits( state );

			// Output canvas is whatever the server would emit: the crop rect
			// if present, otherwise the full rotated AABB. This makes (u, v)
			// map to the same *output* pixel on both paths.
			const outputSize = outputSizeFor( edits, IMAGE );

			const exported = exportSourcePixel(
				state,
				IMAGE,
				outputSize,
				u,
				v
			);
			const server = serverSourcePixel( edits, IMAGE, u, v );

			// Tolerance of 1 source pixel. The two paths compose rotations
			// and scales in different orders, so sub-pixel disagreement is
			// expected from floating-point. Anything larger is a real bug.
			expect( server.x ).toBeCloseTo( exported.x, 0 );
			expect( server.y ).toBeCloseTo( exported.y, 0 );
		} );
	}
} );

describe( 'getOutputSize agrees with getImageEdits', () => {
	// Big enough that a crop just inside the pruning tolerance is still
	// tens of pixels, which a smallest-size check would act on.
	const BIG = { src: 'big.jpg', naturalWidth: 20000, naturalHeight: 10000 };

	it( 'reports the full size when the crop is too near full to be saved', () => {
		const state = makeState( { image: BIG, zoom: 1.0005 } );

		expect( getImageEdits( state ) ).toEqual( [] );
		expect( getOutputSize( state ) ).toEqual( {
			width: 20000,
			height: 10000,
		} );
	} );

	it( 'swaps the sides on a quarter turn', () => {
		const state = makeState( { image: BIG, rotation: 90 } );
		const size = getOutputSize( state );

		expect( size?.width ).toBeCloseTo( 10000, 6 );
		expect( size?.height ).toBeCloseTo( 20000, 6 );
	} );

	it( 'takes the crop out of the image at its rotation', () => {
		// Half the width and all the height of the quarter-turned image.
		const state = makeState( {
			image: BIG,
			rotation: 90,
			cropRect: { x: 0.25, y: 0, width: 0.5, height: 1 },
		} );
		const size = getOutputSize( state );

		expect( size?.width ).toBeCloseTo( 5000, 6 );
		expect( size?.height ).toBeCloseTo( 20000, 6 );
	} );
} );

describe( 'getImageEdits without a loaded image', () => {
	it( 'returns no edits, whatever the edit', () => {
		const state = makeState( { image: null, rotation: 45 } );

		expect( getImageEdits( state ) ).toEqual( [] );
	} );
} );
