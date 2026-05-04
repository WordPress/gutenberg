/**
 * Internal dependencies
 */
import { DEFAULT_STATE } from '../constants';
import {
	clampCropPixelRectToBounds,
	cropPixelRectToNormalizedRect,
	getCropGeometrySnapshot,
	getCropPixelLayoutBounds,
	getCropPixelRect,
	validateCropPixelRectAgainstBounds,
	type CropGeometryInput,
	type CropperLayoutGeometry,
} from '../crop-geometry';
import type { CropperState, Size } from '../types';

const IMAGE: Size = { width: 1000, height: 500 };
const GEOMETRY: CropperLayoutGeometry = {
	canvasSize: { width: 1000, height: 500 },
	elementSize: { width: 1000, height: 500 },
	visualSize: { width: 1000, height: 500 },
	cropBounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
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
		geometry: GEOMETRY,
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

	it( 'computes current-layout edge bounds in crop pixels', () => {
		const layoutBounds = getCropPixelLayoutBounds( makeInput() );

		expect( layoutBounds?.minLeft ).toBeCloseTo( 0 );
		expect( layoutBounds?.minTop ).toBeCloseTo( 0 );
		expect( layoutBounds?.maxRight ).toBeCloseTo( 1000 );
		expect( layoutBounds?.maxBottom ).toBeCloseTo( 500 );
		expect( layoutBounds?.minWidth ).toBeCloseTo( 50 );
		expect( layoutBounds?.minHeight ).toBeCloseTo( 25 );
		expect( layoutBounds?.maxWidth ).toBeCloseTo( 1000 );
		expect( layoutBounds?.maxHeight ).toBeCloseTo( 500 );
	} );

	it( 'returns null layout bounds before geometry is ready', () => {
		const layoutBounds = getCropPixelLayoutBounds( {
			...makeInput(),
			geometry: {
				...GEOMETRY,
				cropBounds: undefined,
			},
		} );

		expect( layoutBounds ).toBeNull();
	} );

	it( 'returns a full geometry snapshot when geometry is ready', () => {
		const snapshot = getCropGeometrySnapshot( makeInput() );

		expect( snapshot?.rect.left ).toBeCloseTo( 200 );
		expect( snapshot?.layoutBounds.maxRight ).toBeCloseTo( 1000 );
		expect( snapshot?.sourceRegion.width ).toBeCloseTo( 400 );
	} );
} );

describe( 'validateCropPixelRectAgainstBounds', () => {
	const layoutBounds = getCropPixelLayoutBounds( makeInput() )!;

	it( 'accepts rectangles within the provided bounds', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: 100, top: 50, width: 400, height: 200 },
			layoutBounds
		);

		expect( result.isValid ).toBe( true );
		expect( result.rect ).toEqual( {
			left: 100,
			top: 50,
			width: 400,
			height: 200,
			right: 500,
			bottom: 250,
		} );
		expect( result.violations ).toEqual( [] );
	} );

	it( 'reports and clamps rectangles outside the provided bounds', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: -20, top: 10, width: 1200, height: 600 },
			layoutBounds
		);

		expect( result.isValid ).toBe( false );
		expect( result.violations ).toEqual(
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
			layoutBounds
		);

		expect( result.isValid ).toBe( false );
		expect( result.violations ).toEqual(
			expect.arrayContaining( [ 'width-too-small', 'height-too-small' ] )
		);
		expect( result.rect.width ).toBeCloseTo( layoutBounds.minWidth );
		expect( result.rect.height ).toBeCloseTo( layoutBounds.minHeight );
	} );

	it( 'sanitizes non-finite values while reporting them', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: Number.NaN, top: 10, width: 100, height: Infinity },
			layoutBounds
		);

		expect( result.isValid ).toBe( false );
		expect( result.violations ).toContain( 'non-finite' );
		expect( result.rect.left ).toBe( layoutBounds.minLeft );
		expect( result.rect.height ).toBe( layoutBounds.minHeight );
	} );

	it( 'reports a catch-all violation when precision-only clamping is required', () => {
		const result = validateCropPixelRectAgainstBounds(
			{
				left: layoutBounds.minLeft - 1e-9,
				top: 50,
				width: 400,
				height: 200,
			},
			layoutBounds
		);

		expect( result.isValid ).toBe( false );
		expect( result.violations ).toEqual( [ 'precision-clamped' ] );
		expect( result.rect.left ).toBe( layoutBounds.minLeft );
	} );
} );

describe( 'clampCropPixelRectToBounds', () => {
	it( 'fits a rectangle into the provided bounds', () => {
		const layoutBounds = getCropPixelLayoutBounds( makeInput() )!;
		const rect = clampCropPixelRectToBounds(
			{ left: 900, top: 450, width: 200, height: 100 },
			layoutBounds
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
