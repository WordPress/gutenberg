/**
 * buildModifiers ↔ Export-camera parity.
 *
 * WHAT THIS TEST GUARANTEES
 *
 * "What the user framed in the stencil is what the server crops from the
 * source." The cropper shows the user a live preview via the *export
 * camera* (`createExportCamera`); the server receives a `modifiers` array
 * from `buildModifiers` and applies them sequentially in the order
 * `[flip, rotate, crop]` (Core's `WP_REST_Attachments_Controller
 * ::edit_media_item`). Both paths must land on the same source pixel for
 * the same spot in the output, otherwise the saved image drifts from
 * what the user framed.
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
 *   2. `serverSourcePixel` — simulates the Core pipeline
 *      (`flip → rotate → crop`) in reverse to find the source pixel the
 *      server would place at (u, v).
 *   3. Assert both answers agree to within 1 source pixel (float slop).
 *
 * A wrong crop rect, frame, or rotation sign makes the two paths
 * diverge and pinpoints the offending (state, probe) pair.
 *
 * ORDER / SIGN NOTES
 *
 * The cropper's export camera composes the source-to-screen chain as
 * `flip · R(θ)` on the (centered) source — rotate first, then flip.
 * Core's `modifiers` pipeline applies `flip` first, then `R(θ')`. For
 * these two chains to land on the same pixel, when exactly one flip
 * axis is set we must send `θ' = -θ` (since `flip_h · R(θ) = R(-θ) ·
 * flip_h`). Both-or-neither flips leave `θ' = θ` because `flip_h · flip_v
 * = -I` commutes with rotation.
 *
 * MAINTENANCE NOTES
 *
 * - If you change `buildModifiers`, this test is the primary safety net.
 *   Run it after any edit to that file or to `createExportCamera`.
 * - If Core's pipeline operation order ever changes, update
 *   `serverSourcePixel` to match — it mirrors the server exactly.
 * - Adding a new cropper operation (e.g. skew) means: extend
 *   `CropperState`, teach `buildModifiers` to emit it, extend
 *   `serverSourcePixel` to undo it, and add values to the grid in
 *   `buildRows`. The probes don't need to change.
 */

/**
 * External dependencies
 */
import { mat2d, vec2 } from 'gl-matrix';

/**
 * Internal dependencies
 */
import { buildModifiers } from '../build-modifiers';
import type { Modifier } from '../build-modifiers';
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

/**
 * Source pixel the cropper draws at output position (u, v). Inverts the
 * export-camera matrix — the same one the preview uses — so whatever the
 * user sees on-screen is exactly what this returns.
 *
 * @param state      Cropper state (rotation/zoom/pan/flip/cropRect).
 * @param imageSize  Natural dimensions of the source image.
 * @param outputSize Output canvas dimensions the camera renders into.
 * @param u          Horizontal probe in [0, 1] across the output.
 * @param v          Vertical probe in [0, 1] across the output.
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
 * Extract the pieces of the server pipeline we need to simulate from a
 * modifier array. `flip` and `rotate` may be absent (identity-pruned),
 * `crop` may also be absent when the full-frame is framed; in that case
 * the output canvas equals the full rotated AABB.
 *
 * @param modifiers Ordered modifier array as emitted by `buildModifiers`.
 */
function readModifiers( modifiers: Modifier[] ): {
	flip: { horizontal: boolean; vertical: boolean };
	rotation: number;
	crop: { left: number; top: number; width: number; height: number } | null;
} {
	const flip = { horizontal: false, vertical: false };
	let rotation = 0;
	let crop: {
		left: number;
		top: number;
		width: number;
		height: number;
	} | null = null;

	for ( const m of modifiers ) {
		if ( m.type === 'flip' ) {
			flip.horizontal = m.args.flip.horizontal;
			flip.vertical = m.args.flip.vertical;
		} else if ( m.type === 'rotate' ) {
			rotation = m.args.angle;
		} else if ( m.type === 'crop' ) {
			crop = {
				left: m.args.left,
				top: m.args.top,
				width: m.args.width,
				height: m.args.height,
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
 * @param modifiers Ordered modifier array the client sends.
 * @param imageSize Natural dimensions of the source image.
 * @param u         Horizontal probe in [0, 1] across the output.
 * @param v         Vertical probe in [0, 1] across the output.
 */
function serverSourcePixel(
	modifiers: Modifier[],
	imageSize: Size,
	u: number,
	v: number
): { x: number; y: number } {
	const { flip, rotation, crop } = readModifiers( modifiers );

	const fullBBox = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		rotation
	);

	// Percent → pixels in the full-AABB frame. When crop is absent the
	// output canvas is the full AABB itself.
	const cropW = crop ? ( crop.width * fullBBox.width ) / 100 : fullBBox.width;
	const cropH = crop
		? ( crop.height * fullBBox.height ) / 100
		: fullBBox.height;
	const cropX = crop ? ( crop.left * fullBBox.width ) / 100 : 0;
	const cropY = crop ? ( crop.top * fullBBox.height ) / 100 : 0;

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
 * Output size the server would produce, computed from the modifier list.
 * With a crop: the crop's pixel dims in the full-AABB frame. Without a
 * crop: the full rotated AABB.
 *
 * @param modifiers Modifier array the server will apply.
 * @param imageSize Natural dimensions of the source image.
 */
function outputSizeFor( modifiers: Modifier[], imageSize: Size ): Size {
	const { rotation, crop } = readModifiers( modifiers );
	const full = getRotatedBBox( imageSize.width, imageSize.height, rotation );
	if ( ! crop ) {
		return { width: full.width, height: full.height };
	}
	return {
		width: ( crop.width * full.width ) / 100,
		height: ( crop.height * full.height ) / 100,
	};
}

describe( 'buildModifiers ↔ Export-camera parity', () => {
	const rows = buildRows();

	it.each( rows )( '$label', ( { state, u, v } ) => {
		const modifiers = buildModifiers( state, IMAGE );

		// Output canvas is whatever the server would emit: the crop rect
		// if present, otherwise the full rotated AABB. This makes (u, v)
		// map to the same *output* pixel on both paths.
		const outputSize = outputSizeFor( modifiers, IMAGE );

		const exported = exportSourcePixel( state, IMAGE, outputSize, u, v );
		const server = serverSourcePixel( modifiers, IMAGE, u, v );

		// Tolerance of 1 source pixel. The two paths compose rotations
		// and scales in different orders, so sub-pixel disagreement is
		// expected from floating-point. Anything larger is a real bug.
		expect( server.x ).toBeCloseTo( exported.x, 0 );
		expect( server.y ).toBeCloseTo( exported.y, 0 );
	} );
} );
