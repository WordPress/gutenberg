/**
 * Internal dependencies
 */
import { DEFAULT_STATE } from '../constants';
import {
	applyCropEdit,
	clampCropPixelRectToBounds,
	cropPixelRectToNormalizedRect,
	getCropGeometrySnapshot,
	getCropPixelRect,
	validateCropPixelRectAgainstBounds,
	type CropGeometryInput,
	type CropPixelRectCheck,
	type CropPixelRectViolation,
	type NormalizedCropBounds,
} from '../crop-geometry';
import type { CropperState, Size } from '../types';

function violationsOf( check: CropPixelRectCheck ): CropPixelRectViolation[] {
	return check.ok ? [] : check.violations;
}

const IMAGE: Size = { width: 1000, height: 500 };
const IMAGE_BOUNDS: NormalizedCropBounds = {
	minX: 0,
	minY: 0,
	maxX: 1,
	maxY: 1,
};

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

function makeInput(
	overrides: Partial< CropGeometryInput > = {}
): CropGeometryInput {
	return {
		state: makeState( {
			cropRect: { x: 0.2, y: 0.2, width: 0.4, height: 0.4 },
		} ),
		imageSize: IMAGE,
		imageBounds: IMAGE_BOUNDS,
		...overrides,
	};
}

describe( 'crop pixel geometry', () => {
	it( 'converts cropper state to snap-rotation pixels', () => {
		const rect = getCropPixelRect( makeInput().state, IMAGE );

		expect( rect.left ).toBeCloseTo( 200 );
		expect( rect.top ).toBeCloseTo( 100 );
		expect( rect.width ).toBeCloseTo( 400 );
		expect( rect.height ).toBeCloseTo( 200 );
		expect( rect.right ).toBeCloseTo( 600 );
		expect( rect.bottom ).toBeCloseTo( 300 );
	} );

	it( 'round-trips pixel rectangles through normalized cropper space', () => {
		const state = makeInput().state;
		const rect = getCropPixelRect( state, IMAGE );
		const normalized = cropPixelRectToNormalizedRect( rect, state, IMAGE );

		expect( normalized.x ).toBeCloseTo( state.cropRect.x );
		expect( normalized.y ).toBeCloseTo( state.cropRect.y );
		expect( normalized.width ).toBeCloseTo( state.cropRect.width );
		expect( normalized.height ).toBeCloseTo( state.cropRect.height );
	} );

	it( 'computes image edge bounds in crop pixels', () => {
		const imageBounds = getCropGeometrySnapshot( makeInput() )?.imageBounds;

		expect( imageBounds?.minLeft ).toBeCloseTo( 0 );
		expect( imageBounds?.minTop ).toBeCloseTo( 0 );
		expect( imageBounds?.maxRight ).toBeCloseTo( 1000 );
		expect( imageBounds?.maxBottom ).toBeCloseTo( 500 );
		expect( imageBounds?.minWidth ).toBeCloseTo( 50 );
		expect( imageBounds?.minHeight ).toBeCloseTo( 25 );
		expect( imageBounds?.maxWidth ).toBeCloseTo( 1000 );
		expect( imageBounds?.maxHeight ).toBeCloseTo( 500 );
	} );

	it( 'returns null before image bounds are ready', () => {
		const snapshot = getCropGeometrySnapshot( {
			...makeInput(),
			imageBounds: undefined,
		} );

		expect( snapshot ).toBeNull();
	} );

	it( 'returns a full geometry snapshot when geometry is ready', () => {
		const snapshot = getCropGeometrySnapshot( makeInput() );

		expect( snapshot?.rect.left ).toBeCloseTo( 200 );
		expect( snapshot?.imageBounds.maxRight ).toBeCloseTo( 1000 );
		expect( snapshot?.sourceRegion.width ).toBeCloseTo( 400 );
	} );
} );

describe( 'validateCropPixelRectAgainstBounds', () => {
	const imageBounds = getCropGeometrySnapshot( makeInput() )!.imageBounds;

	it( 'accepts rectangles within the provided bounds', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: 100, top: 50, width: 400, height: 200 },
			imageBounds
		);

		expect( result.ok ).toBe( true );
		expect( result.rect ).toEqual( {
			left: 100,
			top: 50,
			width: 400,
			height: 200,
			right: 500,
			bottom: 250,
		} );
	} );

	it( 'reports and clamps rectangles outside the provided bounds', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: -20, top: 10, width: 1200, height: 600 },
			imageBounds
		);

		expect( result.ok ).toBe( false );
		expect( violationsOf( result ) ).toEqual(
			expect.arrayContaining( [
				'left-out-of-bounds',
				'right-out-of-bounds',
				'bottom-out-of-bounds',
				'width-too-large',
				'height-too-large',
			] )
		);
		expect( result.rect ).toEqual( {
			left: 0,
			top: 0,
			width: 1000,
			height: 500,
			right: 1000,
			bottom: 500,
		} );
	} );

	it( 'reports and clamps rectangles smaller than the stencil minimum', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: 100, top: 50, width: 10, height: 10 },
			imageBounds
		);

		expect( result.ok ).toBe( false );
		expect( violationsOf( result ) ).toEqual(
			expect.arrayContaining( [ 'width-too-small', 'height-too-small' ] )
		);
		expect( result.rect.width ).toBeCloseTo( imageBounds.minWidth );
		expect( result.rect.height ).toBeCloseTo( imageBounds.minHeight );
	} );

	it( 'sanitizes non-finite values while reporting them', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: Number.NaN, top: 10, width: 100, height: Infinity },
			imageBounds
		);

		expect( result.ok ).toBe( false );
		expect( violationsOf( result ) ).toContain( 'non-finite' );
		expect( result.rect.left ).toBe( imageBounds.minLeft );
		expect( result.rect.height ).toBe( imageBounds.minHeight );
	} );

	it( 'tolerates sub-epsilon drift without flagging it as invalid', () => {
		const result = validateCropPixelRectAgainstBounds(
			{
				left: imageBounds.minLeft - 1e-9,
				top: 50,
				width: 400,
				height: 200,
			},
			imageBounds
		);

		expect( result.ok ).toBe( true );
		expect( result.rect.left ).toBe( imageBounds.minLeft );
	} );
} );

describe( 'clampCropPixelRectToBounds', () => {
	it( 'fits a rectangle into the provided bounds', () => {
		const imageBounds = getCropGeometrySnapshot( makeInput() )!.imageBounds;
		const rect = clampCropPixelRectToBounds(
			{ left: 900, top: 450, width: 200, height: 100 },
			imageBounds
		);

		expect( rect ).toEqual( {
			left: 800,
			top: 400,
			width: 200,
			height: 100,
			right: 1000,
			bottom: 500,
		} );
	} );
} );

describe( 'applyCropEdit', () => {
	const imageBounds = getCropGeometrySnapshot( makeInput() )!.imageBounds;
	const startRect = { left: 100, top: 50, width: 400, height: 200 };

	it( 'applies a left edit and clamps to bounds', () => {
		const rect = applyCropEdit( startRect, 'left', -50, {
			bounds: imageBounds,
		} );

		expect( rect.left ).toBe( imageBounds.minLeft );
		expect( rect.width ).toBe( 400 );
	} );

	it( 'applies a width edit', () => {
		const rect = applyCropEdit( startRect, 'width', 600, {
			bounds: imageBounds,
		} );

		expect( rect.width ).toBe( 600 );
		expect( rect.height ).toBe( 200 );
	} );

	it( 'couples height to width under an aspect ratio lock', () => {
		const rect = applyCropEdit( startRect, 'width', 600, {
			aspectRatio: 2,
			bounds: imageBounds,
		} );

		expect( rect.width ).toBe( 600 );
		expect( rect.height ).toBe( 300 );
	} );

	it( 'couples width to height under an aspect ratio lock', () => {
		const rect = applyCropEdit( startRect, 'height', 100, {
			aspectRatio: 2,
			bounds: imageBounds,
		} );

		expect( rect.height ).toBe( 100 );
		expect( rect.width ).toBe( 200 );
	} );

	it( 'clamps an oversized width to the image bounds', () => {
		const rect = applyCropEdit( startRect, 'width', 9999, {
			bounds: imageBounds,
		} );

		expect( rect.width ).toBe( imageBounds.maxWidth );
	} );

	it( 'clamps an oversized width to aspect-ratio-safe image bounds', () => {
		const rect = applyCropEdit( startRect, 'width', 9999, {
			aspectRatio: 4,
			bounds: imageBounds,
		} );

		expect( rect.width ).toBe( imageBounds.maxWidth );
		expect( rect.height ).toBe( 250 );
	} );

	it( 'clamps an oversized height to aspect-ratio-safe image bounds', () => {
		const rect = applyCropEdit( startRect, 'height', 9999, {
			aspectRatio: 4,
			bounds: imageBounds,
		} );

		expect( rect.width ).toBe( imageBounds.maxWidth );
		expect( rect.height ).toBe( 250 );
	} );

	it( 'clamps undersized aspect-ratio edits to the coupled minimum size', () => {
		const rect = applyCropEdit( startRect, 'width', 1, {
			aspectRatio: 4,
			bounds: imageBounds,
		} );

		expect( rect.width ).toBe( 100 );
		expect( rect.height ).toBe( imageBounds.minHeight );
	} );
} );
