/**
 * buildEditPayload ↔ Export-camera parity.
 *
 * WHAT THIS TEST GUARANTEES
 *
 * "What the user framed in the stencil is what the server crops from the
 * source." The cropper shows the user a live preview via the *export
 * camera* (`createExportCamera`); the server receives `{ transform, crop }`
 * from `buildEditPayload` and applies rotate → flip → crop. Both paths
 * must land on the same source pixel for the same spot in the output,
 * otherwise the saved image drifts from what the user framed.
 *
 * This test asserts that invariant holds for every combination of
 * rotation, zoom, pan, flip, and crop rect the cropper can produce.
 *
 * STRATEGY
 *
 * For each cropper state and each probe point (u, v) ∈ [0, 1]² inside
 * the cropped output:
 *
 *   1. `exportSourcePixel` — inverts the export-camera matrix to find
 *      the source pixel the cropper draws at (u, v). Ground truth:
 *      it's literally what the user sees on screen.
 *   2. `serverSourcePixel` — simulates the server pipeline (rotate →
 *      flip → crop) in reverse to find the source pixel the server
 *      would place at (u, v).
 *   3. Assert both answers agree to within 1 source pixel (float slop).
 *
 * If `buildEditPayload` emits the wrong crop rect — wrong center,
 * dims, or coordinate frame — the two paths diverge and the test
 * pinpoints the offending (state, probe) pair.
 *
 * MAINTENANCE NOTES
 *
 * - If you change `buildEditPayload`, this test is the primary safety
 *   net. Run it after any edit to that file or to `createExportCamera`.
 * - If you change the server pipeline's operation order
 *   (`lib/experimental/source-region-edit.php`), update
 *   `serverSourcePixel` to match — it mirrors the server exactly.
 * - Adding a new cropper operation (e.g. skew) means: extend
 *   `CropperState`, teach `buildEditPayload` to emit it, extend
 *   `serverSourcePixel` to undo it, and add values to the grid in
 *   `buildRows`. The probes don't need to change.
 * - Failures present as huge pixel-diff numbers, not subtle drift.
 *   Look at the state label in the first failing row to isolate the
 *   axis (rotation vs. flip vs. frame conversion) before debugging.
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

/**
 * Build a CropperState seeded with `DEFAULT_STATE` and a fixed test image,
 * overlaid with caller-specified overrides. Keeps each parity row focused
 * on the fields it actually varies (rotation, zoom, pan, flip, cropRect).
 *
 * @param overrides Partial CropperState fields that replace defaults.
 * @return A fully-populated CropperState ready to feed into the cropper.
 */
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

/**
 * Ground-truth half of the parity check: the source pixel the cropper
 * actually draws at screen position `(u, v)` inside the output canvas.
 * Inverts the export camera — the same matrix the live preview uses — so
 * whatever the user sees on-screen is exactly what this returns.
 *
 * Maintenance: this function is a thin wrapper over `createExportCamera`.
 * If the camera's composition order changes (e.g. flip inserted before
 * rotation), no change is needed here — the matrix carries the new order.
 *
 * @param state      Current cropper state (rotation/zoom/pan/flip/cropRect).
 * @param imageSize  Natural dimensions of the source image.
 * @param outputSize Dimensions of the output canvas the camera renders into.
 * @param u          Horizontal probe in [0, 1] across the output.
 * @param v          Vertical probe in [0, 1] across the output.
 * @return Source-pixel coordinates for the sampled output point.
 */
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

/**
 * Server-side half of the parity check: the source pixel the PHP pipeline
 * would land at for output point `(u, v)`, given the payload. Simulates
 * rotate → flip → crop in reverse to go from output back to source.
 *
 * Mapping output → source:
 *   1. output point o = (u·cropW, v·cropH).
 *   2. canvas point c = o + (cropX, cropY) — undo crop translation.
 *   3. undo flip about the full-AABB center.
 *   4. undo rotation about the source center.
 *
 * The full-AABB dims come from `getRotatedBBox(imageSize, rotation)` —
 * same thing the server gets from `WP_Image_Editor` after `rotate()`.
 *
 * Maintenance: this MUST mirror `lib/experimental/source-region-edit.php`.
 * If the server's operation order changes (e.g. crop-before-flip), update
 * the inverse order here to match, or the parity test will false-negative.
 *
 * @param payload   Canonical `{ transform, crop }` the client sends.
 * @param imageSize Natural dimensions of the source image.
 * @param u         Horizontal probe in [0, 1] across the output.
 * @param v         Vertical probe in [0, 1] across the output.
 * @return Source-pixel coordinates the server would place at `(u, v)`.
 */
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
	state: CropperState;
	probeLabel: string;
	u: number;
	v: number;
}

/**
 * Build the full parity grid: every combination of rotation × zoom × pan ×
 * flip × cropRect, each expanded across the probe set. Produces one row
 * per `it.each` case. Each row carries a human-readable `label` that names
 * the exact state and probe, so a failing case points straight at the bug.
 *
 * Maintenance: add new values to the arrays below when a new axis needs
 * coverage. Keep the grid small — the cartesian product grows fast. If you
 * add a new cropper operation (e.g. skew), extend `CropperState`, teach
 * `buildEditPayload` to emit it, extend `serverSourcePixel` to undo it,
 * and add an array here. The probes themselves should not need changes.
 *
 * @return One `ParityRow` per (state, probe) combination.
 */
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
