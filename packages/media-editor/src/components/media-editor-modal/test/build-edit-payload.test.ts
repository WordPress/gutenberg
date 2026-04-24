/**
 * buildEditPayload ↔ Export-camera parity.
 *
 * "What the user framed in the stencil is what the server crops from the
 * source." The server receives `{ transform, crop }` and applies rotate
 * → flip → crop. For every (u, v) inside the stencil rect, the source
 * pixel that ends up at the corresponding output pixel must match the
 * source pixel the preview/export pipeline already renders there.
 *
 * Test strategy (mirrors the preview↔export parity test next door):
 *
 *   1. Pick a cropper state (rotation, zoom, pan, flip, cropRect).
 *   2. Pick a (u, v) in [0,1]^2 — the normalized position inside the
 *      cropped output.
 *   3. Compute the source pixel the EXPORT camera picks for that (u, v).
 *      This is the ground truth: it's what the cropper draws on screen.
 *   4. Compute the source pixel the SERVER path yields by unwinding
 *      rotate → flip → crop on the same (u, v) point in output coords.
 *   5. Assert they agree.
 *
 * If buildEditPayload emits the wrong crop rect — wrong center, wrong
 * dims, wrong frame — the two paths drift and the test fails at the
 * offending probe.
 */

/**
 * External dependencies
 */
import { mat2d, vec2 } from 'gl-matrix';

/**
 * Internal dependencies
 */
import { buildEditPayload } from '../build-edit-payload';
import type { EditPayload } from '../build-edit-payload';
import {
	createExportCamera,
	getRotatedBBox,
} from '../../../image-editor/core/camera';
import { DEFAULT_STATE } from '../../../image-editor/core/constants';
import type { CropperState, Size } from '../../../image-editor/core/types';

const IMAGE: Size = { width: 1600, height: 900 };

function makeState( overrides: Partial< CropperState > = {} ): CropperState {
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

// Source pixel that the export camera maps to (u, v) in the output
// canvas. This is ground truth: the cropper renders exactly this.
function exportSourcePixel(
	state: CropperState,
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

// Source pixel that the server produces for (u, v) in the output, given
// the payload `{ transform, crop }` and `imageSize`. Simulates the server
// pipeline rotate → flip → crop exactly.
//
// Mapping output → source:
//   1. output point o = (u·cropW, v·cropH).
//   2. canvas point c = o + (cropX, cropY) — undo crop translation.
//   3. undo flip about the full-AABB center.
//   4. undo rotation about the source center.
//
// The full-AABB dims come from `getRotatedBBox(imageSize, rotation)` —
// same thing the server gets from `WP_Image_Editor` after `rotate()`.
function serverSourcePixel(
	payload: EditPayload,
	imageSize: Size,
	u: number,
	v: number
): { x: number; y: number } {
	const { transform, crop } = payload;
	const fullBBox = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		transform.rotation
	);

	// Undo crop translation.
	let cx = u * crop.width + crop.x;
	let cy = v * crop.height + crop.y;

	// Undo flip (flip is its own inverse). Flip axes are the post-rotate
	// canvas center, matching createExportCamera's composition order
	// (`S_flip · R_rotation`) and the server's flip-after-rotate.
	if ( transform.flip.horizontal ) {
		cx = fullBBox.width - cx;
	}
	if ( transform.flip.vertical ) {
		cy = fullBBox.height - cy;
	}

	// Undo rotation about source center. Server's forward rotation matches
	// gl-matrix `mat2d.rotate`: (x, y) → (x·cos - y·sin, x·sin + y·cos) —
	// CW visually under y-down coords. Inverse is the transpose:
	// (x, y) → (x·cos + y·sin, -x·sin + y·cos).
	const rad = ( transform.rotation * Math.PI ) / 180;
	const cos = Math.cos( rad );
	const sin = Math.sin( rad );
	const dx = cx - fullBBox.width / 2;
	const dy = cy - fullBBox.height / 2;
	const sx = dx * cos + dy * sin + imageSize.width / 2;
	const sy = -dx * sin + dy * cos + imageSize.height / 2;
	return { x: sx, y: sy };
}

// Five probe points — corners catch offset/scale drift, center catches
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
	state: CropperState;
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
	return rows;
}

describe( 'buildEditPayload ↔ Export-camera parity', () => {
	const rows = buildRows();

	it.each( rows )( '$label', ( { state, u, v } ) => {
		const payload = buildEditPayload( state, IMAGE );

		// Output size for the export camera is the payload's crop dims —
		// the server's output before any optional resize. This makes (u, v)
		// map to the same *output* pixel on both paths.
		const outputSize: Size = {
			width: payload.crop.width,
			height: payload.crop.height,
		};

		const exported = exportSourcePixel( state, IMAGE, outputSize, u, v );
		const server = serverSourcePixel( payload, IMAGE, u, v );

		// Tolerance of 1 source pixel. The two paths compose rotations
		// and scales in different orders, so sub-pixel disagreement is
		// expected from floating-point. Anything larger is a real bug.
		expect( server.x ).toBeCloseTo( exported.x, 0 );
		expect( server.y ).toBeCloseTo( exported.y, 0 );
	} );
} );
