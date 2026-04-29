/**
 * getCropPixels / pixelsToCropRect
 *
 * WHAT THESE TESTS GUARANTEE
 *
 * 1. Known-value: for a fully-specified cropper state the pixel values must
 *    equal the hand-computed expected result (guards against future formula
 *    drift).
 *
 * 2. Round-trip: pixelsToCropRect( getCropPixels( state, img ), state, img )
 *    must reproduce state.cropRect exactly (within float epsilon). If either
 *    function drifts, the advanced panel inputs will silently shift the crop
 *    on commit.
 *
 * 3. buildModifiers parity: the widthPx / heightPx that getCropPixels returns
 *    must equal the pixel dimensions computed by the inline math inside
 *    buildModifiers for the same state. This keeps the UI inputs and the
 *    server payload in lock-step — if they disagree the user sees one size
 *    on-screen but crops to a different size on save.
 */

/**
 * Internal dependencies
 */
import { DEFAULT_STATE } from '../../image-editor/core/constants';
import type { CropperState, Size } from '../../image-editor/core/types';
import { buildModifiers } from '../../components/media-editor-modal/build-modifiers';
import { getCropPixels, pixelsToCropRect } from '../crop-pixels';

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

// ─── Known-value cases ───────────────────────────────────────────────────────

describe( 'getCropPixels – known values', () => {
	it( 'identity state: full image at zoom 1', () => {
		const state = makeState();
		const px = getCropPixels( state, IMAGE );
		expect( px.x ).toBeCloseTo( 0 );
		expect( px.y ).toBeCloseTo( 0 );
		expect( px.width ).toBeCloseTo( IMAGE.width );
		expect( px.height ).toBeCloseTo( IMAGE.height );
		expect( px.snapBBoxWidth ).toBeCloseTo( IMAGE.width );
		expect( px.snapBBoxHeight ).toBeCloseTo( IMAGE.height );
	} );

	it( 'centered 50% crop at zoom 1', () => {
		const state = makeState( {
			cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		} );
		const px = getCropPixels( state, IMAGE );
		expect( px.x ).toBeCloseTo( IMAGE.width * 0.25 );
		expect( px.y ).toBeCloseTo( IMAGE.height * 0.25 );
		expect( px.width ).toBeCloseTo( IMAGE.width * 0.5 );
		expect( px.height ).toBeCloseTo( IMAGE.height * 0.5 );
	} );

	it( 'zoom 2 full-crop: snap-AABB is still source size, crop is half the image', () => {
		const state = makeState( { zoom: 2 } );
		// imgLeft = 0.5 + 0 - 2/2 = -0.5; cropRect.x = 0 → snapX = (0 - (-0.5)) / 2 * W = W/4
		const px = getCropPixels( state, IMAGE );
		expect( px.x ).toBeCloseTo( IMAGE.width * 0.25 );
		expect( px.y ).toBeCloseTo( IMAGE.height * 0.25 );
		expect( px.width ).toBeCloseTo( IMAGE.width * 0.5 );
		expect( px.height ).toBeCloseTo( IMAGE.height * 0.5 );
		// snapBBox is still the source image at 0° rotation.
		expect( px.snapBBoxWidth ).toBeCloseTo( IMAGE.width );
		expect( px.snapBBoxHeight ).toBeCloseTo( IMAGE.height );
	} );

	it( '90° rotation: snap-AABB axes are swapped', () => {
		const state = makeState( { rotation: 90 } );
		const px = getCropPixels( state, IMAGE );
		// After 90° the snap-AABB is H×W (height becomes width).
		expect( px.snapBBoxWidth ).toBeCloseTo( IMAGE.height );
		expect( px.snapBBoxHeight ).toBeCloseTo( IMAGE.width );
	} );

	it( 'non-zero pan shifts the crop position', () => {
		// Pan right by 0.1 moves imgLeft right, pushing the crop left in source pixels.
		const noPan = makeState();
		const withPan = makeState( { pan: { x: 0.1, y: 0 } } );
		const pxNoPan = getCropPixels( noPan, IMAGE );
		const pxWithPan = getCropPixels( withPan, IMAGE );
		// imgLeft with pan = 0.5 + 0.1 - 0.5 = 0.1; without pan = 0.
		// snapX = (cropRect.x - imgLeft) / zoom * W = (0 - 0.1) / 1 * W = -0.1 * W (negative = off-image edge, clamped later by setCropRect)
		// The point is that they differ.
		expect( pxWithPan.x ).not.toBeCloseTo( pxNoPan.x );
	} );
} );

// ─── Round-trip ──────────────────────────────────────────────────────────────

interface RoundTripRow {
	label: string;
	state: CropperState;
}

function buildRoundTripRows(): RoundTripRow[] {
	const rotations = [ 0, 45, 90, 135, 180, 270 ];
	const zooms = [ 1, 1.5, 2.5 ];
	const pans = [
		{ x: 0, y: 0 },
		{ x: 0.08, y: -0.05 },
		{ x: -0.1, y: 0.12 },
	];
	const cropRects = [
		{ x: 0, y: 0, width: 1, height: 1 },
		{ x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		{ x: 0.1, y: 0.2, width: 0.45, height: 0.55 },
	];

	const rows: RoundTripRow[] = [];
	for ( const rotation of rotations ) {
		for ( const zoom of zooms ) {
			for ( const pan of pans ) {
				for ( const cropRect of cropRects ) {
					rows.push( {
						label: `rot=${ rotation } zoom=${ zoom } pan=(${ pan.x },${ pan.y }) crop=(${ cropRect.x },${ cropRect.y },${ cropRect.width },${ cropRect.height })`,
						state: makeState( { rotation, zoom, pan, cropRect } ),
					} );
				}
			}
		}
	}
	return rows;
}

describe( 'getCropPixels / pixelsToCropRect round-trip', () => {
	it.each( buildRoundTripRows() )( '$label', ( { state } ) => {
		const px = getCropPixels( state, IMAGE );
		const recovered = pixelsToCropRect( px, state, IMAGE );

		expect( recovered.x ).toBeCloseTo( state.cropRect.x, 10 );
		expect( recovered.y ).toBeCloseTo( state.cropRect.y, 10 );
		expect( recovered.width ).toBeCloseTo( state.cropRect.width, 10 );
		expect( recovered.height ).toBeCloseTo( state.cropRect.height, 10 );
	} );
} );

// ─── buildModifiers parity ───────────────────────────────────────────────────

interface ParityRow {
	label: string;
	state: CropperState;
}

function buildParityRows(): ParityRow[] {
	const rotations = [ 0, 90, 180, 270 ];
	const zooms = [ 1, 2 ];
	const cropRects = [
		{ x: 0, y: 0, width: 1, height: 1 },
		{ x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
	];

	return rotations.flatMap( ( rotation ) =>
		zooms.flatMap( ( zoom ) =>
			cropRects.map( ( cropRect ) => ( {
				label: `rot=${ rotation } zoom=${ zoom } crop=(${ cropRect.x },${ cropRect.y },${ cropRect.width },${ cropRect.height })`,
				state: makeState( { rotation, zoom, cropRect } ),
			} ) )
		)
	);
}

describe( 'getCropPixels / buildModifiers parity', () => {
	// Full-frame rows produce no crop modifier; split them out so expects
	// are unconditional (avoids jest/no-conditional-expect).
	const fullFrameRows = buildParityRows().filter( ( { state } ) => {
		const mods = buildModifiers( state, IMAGE );
		return ! mods.find( ( m ) => m.type === 'crop' );
	} );
	const croppedRows = buildParityRows().filter( ( { state } ) => {
		const mods = buildModifiers( state, IMAGE );
		return !! mods.find( ( m ) => m.type === 'crop' );
	} );

	it.each( fullFrameRows )( 'full-frame: $label', ( { state } ) => {
		// No crop modifier means full-frame. getCropPixels should span the
		// full snap-AABB.
		const px = getCropPixels( state, IMAGE );
		expect( px.x ).toBeCloseTo( 0, 5 );
		expect( px.y ).toBeCloseTo( 0, 5 );
		expect( px.width ).toBeCloseTo( px.snapBBoxWidth, 5 );
		expect( px.height ).toBeCloseTo( px.snapBBoxHeight, 5 );
	} );

	it.each( croppedRows )( 'cropped: $label', ( { state } ) => {
		const modifiers = buildModifiers( state, IMAGE );
		const cropModifier = modifiers.find( ( m ) => m.type === 'crop' ) as {
			type: 'crop';
			args: { left: number; top: number; width: number; height: number };
		};

		const px = getCropPixels( state, IMAGE );

		// buildModifiers emits percentages of the *full-rotation* AABB (not
		// the snap-AABB), so we recover the pixel dimensions it encodes and
		// compare only width/height — size is frame-independent; position
		// differs because the two frames have different origins.
		// At snap-only rotations (0°, 90°, 180°, 270°) snap == full, so
		// widthPct * snapBBoxWidth / 100 == widthPx directly.
		const recoveredWidth =
			( cropModifier.args.width / 100 ) * px.snapBBoxWidth;
		const recoveredHeight =
			( cropModifier.args.height / 100 ) * px.snapBBoxHeight;

		expect( px.width ).toBeCloseTo( recoveredWidth, 3 );
		expect( px.height ).toBeCloseTo( recoveredHeight, 3 );
	} );
} );
