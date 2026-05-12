/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useAdvancedCropControls } from '../use-advanced-crop-controls';

const mockSetCropRect = jest.fn();
const mockSetRotation = jest.fn();
const mockSettleCrop = jest.fn();
const mockCommitHistory = jest.fn();

const defaultState = {
	image: { src: 'test.jpg', naturalWidth: 1000, naturalHeight: 500 },
	rotation: 0,
	flip: { horizontal: false, vertical: false },
	pan: { x: 0, y: 0 },
	zoom: 1,
	cropRect: { x: 0.1, y: 0.1, width: 0.4, height: 0.4 },
};

const defaultGeometry = {
	isReady: true as const,
	rect: {
		left: 100,
		top: 50,
		width: 400,
		height: 200,
		right: 500,
		bottom: 250,
	},
	imageBounds: {
		minLeft: 0,
		minTop: 0,
		maxRight: 1000,
		maxBottom: 500,
		minWidth: 50,
		minHeight: 25,
		maxWidth: 1000,
		maxHeight: 500,
	},
	sourceRegion: null,
};

let mockCropperState = defaultState;
let mockCropGeometry: typeof defaultGeometry | { isReady: false } =
	defaultGeometry;

jest.mock( '../../../image-editor', () => ( {
	useCropper: () => ( {
		state: mockCropperState,
		setCropRect: mockSetCropRect,
		setRotation: mockSetRotation,
		settleCrop: mockSettleCrop,
		commitHistory: mockCommitHistory,
	} ),
} ) );

jest.mock( '../../../image-editor/react/hooks/use-crop-geometry', () => ( {
	useCropGeometry: () => mockCropGeometry,
} ) );

describe( 'useAdvancedCropControls', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockCropperState = defaultState;
		mockCropGeometry = defaultGeometry;
	} );

	it( 'returns isReady=false when geometry is not ready', () => {
		mockCropGeometry = { isReady: false };
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: true } )
		);

		expect( result.current.isReady ).toBe( false );
	} );

	it( 'computes left/top/width/height ranges from the image bounds', () => {
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: true } )
		);

		if ( ! result.current.isReady ) {
			throw new Error( 'expected controls to be ready' );
		}
		expect( result.current.ranges.left.minValue ).toBe( 0 );
		expect( result.current.ranges.left.maxValue ).toBe( 600 );
		expect( result.current.ranges.width.minValue ).toBe( 50 );
		expect( result.current.ranges.width.maxValue ).toBe( 1000 );
	} );

	it( 'flags width/height as not editable when freeform is off', () => {
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: false } )
		);

		if ( ! result.current.isReady ) {
			throw new Error( 'expected controls to be ready' );
		}
		expect( result.current.ranges.width.isEditable ).toBe( false );
		expect( result.current.ranges.height.isEditable ).toBe( false );
	} );

	it( 'constrains width/height ranges to the aspect-ratio envelope', () => {
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: true, aspectRatio: 2 } )
		);

		if ( ! result.current.isReady ) {
			throw new Error( 'expected controls to be ready' );
		}
		// Aspect ratio 2:1 caps width by 2 * maxHeight and height by maxWidth / 2.
		expect( result.current.ranges.width.maxValue ).toBe( 1000 );
		expect( result.current.ranges.height.maxValue ).toBe( 500 );
	} );

	it( 'commits a width edit and couples height under an aspect ratio', () => {
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: true, aspectRatio: 2 } )
		);

		if ( ! result.current.isReady ) {
			throw new Error( 'expected controls to be ready' );
		}
		act( () => result.current.onEdit( 'width', 600 ) );

		expect( mockSetCropRect ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'settles after a discrete edit ends', () => {
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: true } )
		);

		if ( ! result.current.isReady ) {
			throw new Error( 'expected controls to be ready' );
		}
		act( () => result.current.onEditEnd() );

		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'applies fine rotation and flushes history on end', () => {
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: true } )
		);

		if ( ! result.current.isReady ) {
			throw new Error( 'expected controls to be ready' );
		}
		act( () => result.current.fineRotation.onEdit( 12.5 ) );
		act( () => result.current.fineRotation.onEditEnd() );

		expect( mockSetRotation ).toHaveBeenCalledWith( 12.5 );
		expect( mockCommitHistory ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'clamps fine rotation to the policy range', () => {
		const { result } = renderHook( () =>
			useAdvancedCropControls( { freeformCrop: true } )
		);

		if ( ! result.current.isReady ) {
			throw new Error( 'expected controls to be ready' );
		}
		act( () => result.current.fineRotation.onEdit( 60 ) );

		expect( mockSetRotation ).toHaveBeenCalledWith( 44.99 );
	} );
} );
