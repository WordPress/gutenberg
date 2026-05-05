/**
 * Internal dependencies
 */
import { DEFAULT_STATE } from '../constants';
import {
	clampCropPixelRectToBounds,
	cropPixelRectToNormalizedRect,
	getCropGeometrySnapshot,
	getCropPixelImageBounds,
	getCropPixelRect,
	validateCropPixelRectAgainstBounds,
	type CropGeometryInput,
	type MeasuredCropperGeometry,
} from '../crop-geometry';
import type { CropperState, Size } from '../types';

const IMAGE: Size = { width: 1000, height: 500 };
const GEOMETRY: MeasuredCropperGeometry = {
	canvasSize: { width: 1000, height: 500 },
	elementSize: { width: 1000, height: 500 },
	visualSize: { width: 1000, height: 500 },
	imageBounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
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

	it( 'computes image edge bounds in crop pixels', () => {
		const imageBounds = getCropPixelImageBounds( makeInput() );

		expect( imageBounds?.minLeft ).toBeCloseTo( 0 );
		expect( imageBounds?.minTop ).toBeCloseTo( 0 );
		expect( imageBounds?.maxRight ).toBeCloseTo( 1000 );
		expect( imageBounds?.maxBottom ).toBeCloseTo( 500 );
		expect( imageBounds?.minWidth ).toBeCloseTo( 50 );
		expect( imageBounds?.minHeight ).toBeCloseTo( 25 );
		expect( imageBounds?.maxWidth ).toBeCloseTo( 1000 );
		expect( imageBounds?.maxHeight ).toBeCloseTo( 500 );
	} );

	it( 'returns null image bounds before geometry is ready', () => {
		const imageBounds = getCropPixelImageBounds( {
			...makeInput(),
			geometry: {
				...GEOMETRY,
				imageBounds: undefined,
			},
		} );

		expect( imageBounds ).toBeNull();
	} );

	it( 'uses published image bounds without requiring raw layout sizes', () => {
		const imageBounds = getCropPixelImageBounds( {
			...makeInput(),
			geometry: {
				canvasSize: { width: 0, height: 0 },
				elementSize: { width: 0, height: 0 },
				visualSize: { width: 0, height: 0 },
				imageBounds: GEOMETRY.imageBounds,
			},
		} );

		expect( imageBounds?.maxRight ).toBeCloseTo( IMAGE.width );
		expect( imageBounds?.maxBottom ).toBeCloseTo( IMAGE.height );
	} );

	it( 'returns a full geometry snapshot when geometry is ready', () => {
		const snapshot = getCropGeometrySnapshot( makeInput() );

		expect( snapshot?.rect.left ).toBeCloseTo( 200 );
		expect( snapshot?.bounds.image.maxRight ).toBeCloseTo( 1000 );
		expect( snapshot?.bounds.viewport ).toBeNull();
		expect( snapshot?.sourceRegion.width ).toBeCloseTo( 400 );
	} );

	it( 'converts optional viewport bounds with the same bounds helper', () => {
		const snapshot = getCropGeometrySnapshot( {
			...makeInput(),
			geometry: {
				...GEOMETRY,
				viewportBounds: {
					minX: 0.1,
					minY: 0.2,
					maxX: 0.9,
					maxY: 0.8,
				},
			},
		} );

		expect( snapshot?.bounds.viewport?.minLeft ).toBeCloseTo( 100 );
		expect( snapshot?.bounds.viewport?.minTop ).toBeCloseTo( 100 );
		expect( snapshot?.bounds.viewport?.maxRight ).toBeCloseTo( 900 );
		expect( snapshot?.bounds.viewport?.maxBottom ).toBeCloseTo( 400 );
	} );
} );

describe( 'validateCropPixelRectAgainstBounds', () => {
	const imageBounds = getCropPixelImageBounds( makeInput() )!;

	it( 'accepts rectangles within the provided bounds', () => {
		const result = validateCropPixelRectAgainstBounds(
			{ left: 100, top: 50, width: 400, height: 200 },
			imageBounds
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
			imageBounds
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
			imageBounds
		);

		expect( result.isValid ).toBe( false );
		expect( result.violations ).toEqual(
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

		expect( result.isValid ).toBe( false );
		expect( result.violations ).toContain( 'non-finite' );
		expect( result.rect.left ).toBe( imageBounds.minLeft );
		expect( result.rect.height ).toBe( imageBounds.minHeight );
	} );

	it( 'reports a catch-all violation when precision-only clamping is required', () => {
		const result = validateCropPixelRectAgainstBounds(
			{
				left: imageBounds.minLeft - 1e-9,
				top: 50,
				width: 400,
				height: 200,
			},
			imageBounds
		);

		expect( result.isValid ).toBe( false );
		expect( result.violations ).toEqual( [ 'precision-clamped' ] );
		expect( result.rect.left ).toBe( imageBounds.minLeft );
	} );
} );

describe( 'clampCropPixelRectToBounds', () => {
	it( 'fits a rectangle into the provided bounds', () => {
		const imageBounds = getCropPixelImageBounds( makeInput() )!;
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
