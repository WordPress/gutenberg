/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import CropAdvancedPanel from '../crop-advanced-panel';

const mockApplyOperation = jest.fn();
const mockSettleCrop = jest.fn();
const mockNormalizedRect = { x: 0, y: 0, width: 1, height: 1 };
const mockValidateCropPixelRectAgainstBounds = jest.fn( ( candidate ) => ( {
	isValid: true,
	rect: {
		...candidate,
		right: candidate.left + candidate.width,
		bottom: candidate.top + candidate.height,
	},
	violations: [],
} ) );
const mockCropPixelRectToNormalizedRect = jest.fn( () => mockNormalizedRect );

jest.mock( '../../../image-editor', () => ( {
	cropPixelRectToNormalizedRect: (
		...args: Parameters< typeof mockCropPixelRectToNormalizedRect >
	) => mockCropPixelRectToNormalizedRect( ...args ),
	useCropGeometry: () => ( {
		isReady: true,
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
	} ),
	useCropper: () => ( {
		state: {
			image: {
				src: 'test.jpg',
				naturalWidth: 1000,
				naturalHeight: 500,
			},
		},
		applyOperation: mockApplyOperation,
		settleCrop: mockSettleCrop,
	} ),
	validateCropPixelRectAgainstBounds: (
		...args: Parameters< typeof mockValidateCropPixelRectAgainstBounds >
	) => mockValidateCropPixelRectAgainstBounds( ...args ),
} ) );

describe( 'CropAdvancedPanel', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'settles after applying a numeric crop edit', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '600' } } );
		fireEvent.blur( widthInput );

		expect( mockValidateCropPixelRectAgainstBounds ).toHaveBeenCalledWith(
			{
				left: 100,
				top: 50,
				width: 600,
				height: 200,
			},
			expect.objectContaining( {
				maxRight: 1000,
				maxBottom: 500,
			} )
		);
		expect( mockApplyOperation ).toHaveBeenCalledWith( {
			type: 'crop',
			rect: mockNormalizedRect,
		} );
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );
} );
