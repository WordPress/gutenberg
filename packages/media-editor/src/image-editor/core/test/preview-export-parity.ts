/**
 * Preview ↔ Export parity — the load-bearing invariant of an image cropper.
 *
 * "What you see in the stencil is what you get in the exported file."
 * If this ever breaks silently, users can't trust the tool.
 *
 * How the test works (read this before changing anything):
 *
 * 1. Pick a state (rotation, zoom, pan, flip, cropRect).
 * 2. Pick a position (u, v) inside the crop rect, where (0,0) is the
 *    stencil's top-left and (1,1) is its bottom-right.
 * 3. Compute the source-image pixel the PREVIEW shows at (u, v):
 *      - Screen point = stencil origin + (u, v) * stencil size.
 *      - Inverse of createCamera → world → × imageSize → source pixel.
 * 4. Compute the source-image pixel the EXPORT picks at the SAME (u, v):
 *      - Output canvas point = (u * outW, v * outH).
 *      - Inverse of createExportCamera → source pixel.
 * 5. Assert they agree.
 *
 * The (u, v) parametrization is deliberate: both the preview and the
 * export map the same (u, v) back to a source pixel through entirely
 * different code paths. If the two paths disagree anywhere in the
 * rotation / zoom / pan / flip / crop / output-size space, the
 * invariant has been broken and users see something different from
 * what they download.
 *
 * Why this is load-bearing: the crop regression that shifted exports
 * sideways during fine rotation would have been caught by this test —
 * the center would agree (symmetric bug) but the corners would drift.
 */
import { mat2d, vec2 } from 'gl-matrix';

import {
	createCamera,
	createExportCamera,
	screenToWorld,
	getVisibleBounds,
} from '../camera';
import { DEFAULT_STATE } from '../constants';
import type { CropperState, Size } from '../types';

const CONTAINER: Size = { width: 800, height: 600 };
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

// (u, v) = (0, 0) is the stencil's top-left, (1, 1) is bottom-right.
function stencilScreenPoint(
	state: CropperState,
	container: Size,
	imageSize: Size,
	u: number,
	v: number
): { x: number; y: number } {
	// The stencil lives in the snap-rotation visible bounds (that's
	// how the render path positions it — see rectangle-stencil.tsx
	// and the snap rotation logic in createCamera).
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const baseCamera = createCamera(
		{
			...state,
			pan: { x: 0, y: 0 },
			zoom: 1,
			rotation: snapRotation,
		},
		container,
		imageSize
	);
	const vb = getVisibleBounds( baseCamera );
	const cr = state.cropRect;
	return {
		x: vb.left + ( cr.x + u * cr.width ) * vb.width,
		y: vb.top + ( cr.y + v * cr.height ) * vb.height,
	};
}

function previewSourcePixel(
	state: CropperState,
	container: Size,
	imageSize: Size,
	screen: { x: number; y: number }
): { x: number; y: number } {
	const camera = createCamera( state, container, imageSize );
	const world = screenToWorld( camera, screen );
	return {
		x: world.x * imageSize.width,
		y: world.y * imageSize.height,
	};
}

function exportSourcePixel(
	state: CropperState,
	imageSize: Size,
	outputSize: Size,
	outputPoint: { x: number; y: number }
): { x: number; y: number } {
	const camera = createExportCamera( state, imageSize, outputSize );
	const inv = mat2d.create();
	mat2d.invert( inv, camera );
	const out = vec2.create();
	vec2.transformMat2d( out, [ outputPoint.x, outputPoint.y ], inv );
	return { x: out[ 0 ], y: out[ 1 ] };
}

// Five probe points: 4 corners + center. Corners catch offset/scale
// drift, center catches uniform bugs, and the asymmetric "interior"
// cases below add two more via the test matrix.
const PROBES: { label: string; u: number; v: number }[] = [
	{ label: 'top-left', u: 0, v: 0 },
	{ label: 'top-right', u: 1, v: 0 },
	{ label: 'bottom-right', u: 1, v: 1 },
	{ label: 'bottom-left', u: 0, v: 1 },
	{ label: 'center', u: 0.5, v: 0.5 },
	{ label: 'interior-1', u: 0.3, v: 0.7 },
	{ label: 'interior-2', u: 0.8, v: 0.25 },
];

// All (state × output-size × probe) combinations flattened into rows
// for `it.each`. Each row is self-describing; on failure, the label
// pinpoints the exact state and probe point where preview / export
// disagreed.
interface ParityRow {
	label: string;
	state: CropperState;
	outputSize: Size;
	probeLabel: string;
	u: number;
	v: number;
}

function buildRows(): ParityRow[] {
	const rotations = [ 0, 15, 45, 60, 90, 135, 200, 270 ];
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
	const outputSizes: Size[] = [
		{ width: 400, height: 300 },
		{ width: 1024, height: 768 },
	];

	const rows: ParityRow[] = [];
	for ( const rotation of rotations ) {
		for ( const zoom of zooms ) {
			for ( const pan of pans ) {
				for ( const flip of flips ) {
					for ( const { label: cropLabel, rect } of cropRects ) {
						for ( const outputSize of outputSizes ) {
							const flipLabel = `${
								flip.horizontal ? 'H' : '-'
							}${ flip.vertical ? 'V' : '-' }`;
							const stateLabel = `rot=${ rotation } zoom=${ zoom } pan=(${ pan.x },${ pan.y }) flip=${ flipLabel } crop=${ cropLabel } out=${ outputSize.width }x${ outputSize.height }`;
							const state = makeState( {
								rotation,
								zoom,
								pan,
								flip,
								cropRect: rect,
							} );
							for ( const {
								label: probeLabel,
								u,
								v,
							} of PROBES ) {
								rows.push( {
									label: `${ stateLabel } probe=${ probeLabel }`,
									state,
									outputSize,
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
	}
	return rows;
}

describe( 'Preview ↔ Export parity', () => {
	// Parametric sweep: same (u, v) inside the stencil → same source
	// pixel, across rotations × zooms × pans × flips × crop rects ×
	// output sizes. 5 + 2 probes per state (corners, center, two
	// asymmetric interior points) catch drift the center alone would
	// miss.
	const rows = buildRows();

	it.each( rows )( '$label', ( { state, outputSize, u, v } ) => {
		const screen = stencilScreenPoint( state, CONTAINER, IMAGE, u, v );
		const outputPoint = {
			x: u * outputSize.width,
			y: v * outputSize.height,
		};
		const preview = previewSourcePixel( state, CONTAINER, IMAGE, screen );
		const exported = exportSourcePixel(
			state,
			IMAGE,
			outputSize,
			outputPoint
		);

		// Tolerance of 1 source pixel. Intermediate scale factors differ
		// between the preview (container pixels) and export (output
		// pixels) paths, so sub-pixel agreement is unrealistic. A drift
		// of ~1px is still visibly correct; anything larger is a real
		// coordinate-system mismatch.
		expect( preview.x ).toBeCloseTo( exported.x, 0 );
		expect( preview.y ).toBeCloseTo( exported.y, 0 );
	} );
} );
