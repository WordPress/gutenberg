/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import CropAdvancedPanel from '../crop-advanced-panel';

const mockApplyOperation = jest.fn();
const mockSettleCrop = jest.fn();
const mockNormalizedRect = { x: 0, y: 0, width: 1, height: 1 };
const mockDefaultCropperState = {
	image: {
		src: 'test.jpg',
		naturalWidth: 1000,
		naturalHeight: 500,
	},
	rotation: 0,
	flip: {
		horizontal: false,
		vertical: false,
	},
};
const mockDefaultCropGeometry = {
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
};
type MockCropGeometry = typeof mockDefaultCropGeometry;
type MockCropperState = typeof mockDefaultCropperState;
type MockCropGeometryOverrides = Partial<
	Omit< MockCropGeometry, 'rect' | 'imageBounds' >
> & {
	rect?: Partial< MockCropGeometry[ 'rect' ] >;
	imageBounds?: Partial< MockCropGeometry[ 'imageBounds' ] >;
};
type MockCropperStateOverrides = Partial<
	Omit< MockCropperState, 'image' | 'flip' >
> & {
	image?: Partial< MockCropperState[ 'image' ] >;
	flip?: Partial< MockCropperState[ 'flip' ] >;
};
let mockCropGeometry = mockDefaultCropGeometry;
let mockCropperState = mockDefaultCropperState;
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

function setMockCropGeometry( overrides: MockCropGeometryOverrides = {} ) {
	mockCropGeometry = {
		...mockDefaultCropGeometry,
		...overrides,
		rect: {
			...mockDefaultCropGeometry.rect,
			...overrides.rect,
		},
		imageBounds: {
			...mockDefaultCropGeometry.imageBounds,
			...overrides.imageBounds,
		},
	};
}

function setMockCropperState( overrides: MockCropperStateOverrides = {} ) {
	mockCropperState = {
		...mockDefaultCropperState,
		...overrides,
		image: {
			...mockDefaultCropperState.image,
			...overrides.image,
		},
		flip: {
			...mockDefaultCropperState.flip,
			...overrides.flip,
		},
	};
}

jest.mock( '../../../image-editor', () => ( {
	cropPixelRectToNormalizedRect: (
		...args: Parameters< typeof mockCropPixelRectToNormalizedRect >
	) => mockCropPixelRectToNormalizedRect( ...args ),
	useCropGeometry: () => mockCropGeometry,
	useCropper: () => ( {
		state: mockCropperState,
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
		jest.useRealTimers();
		setMockCropGeometry();
		setMockCropperState();
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

	it( 'treats near-integer maximum bounds as the expected integer pixel value', () => {
		setMockCropGeometry( {
			rect: {
				left: 0,
				right: 400,
			},
			imageBounds: {
				maxRight: 2559.999999999,
				maxWidth: 2559.999999999,
			},
		} );
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '2560' } } );
		fireEvent.blur( widthInput );

		expect( mockValidateCropPixelRectAgainstBounds ).toHaveBeenCalledWith(
			expect.objectContaining( {
				width: 2560,
			} ),
			expect.objectContaining( {
				maxRight: 2559.999999999,
			} )
		);
	} );

	it( 'uses the image max width when the crop left has subpixel drift', () => {
		setMockCropGeometry( {
			rect: {
				left: 0.5,
				right: 400.5,
			},
			imageBounds: {
				maxRight: 1350,
				maxWidth: 1350,
			},
		} );
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '1350' } } );
		fireEvent.blur( widthInput );

		expect( mockValidateCropPixelRectAgainstBounds ).toHaveBeenCalledWith(
			expect.objectContaining( {
				left: 0.5,
				width: 1350,
			} ),
			expect.objectContaining( {
				maxRight: 1350,
				maxWidth: 1350,
			} )
		);
	} );

	it( 'treats near-integer minimum bounds as the expected integer pixel value', () => {
		setMockCropGeometry( {
			imageBounds: {
				minLeft: 0.000000001,
			},
		} );
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const leftInput = screen.getByLabelText( 'Crop left position' );
		fireEvent.focus( leftInput );
		fireEvent.change( leftInput, { target: { value: '0' } } );
		fireEvent.blur( leftInput );

		expect( mockValidateCropPixelRectAgainstBounds ).toHaveBeenCalledWith(
			expect.objectContaining( {
				left: 0,
			} ),
			expect.objectContaining( {
				minLeft: 0.000000001,
			} )
		);
	} );

	it( 'uses the latest bounds when a delayed preview is applied', () => {
		jest.useFakeTimers();
		setMockCropGeometry( {
			rect: {
				left: 0,
				right: 400,
			},
			imageBounds: {
				maxRight: 2790,
				maxWidth: 2790,
			},
		} );
		const { rerender } = render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '2790' } } );

		setMockCropGeometry( {
			rect: {
				left: 0,
				right: 400,
			},
			imageBounds: {
				maxRight: 2560,
				maxWidth: 2560,
			},
		} );
		rerender( <CropAdvancedPanel freeformCrop /> );

		act( () => {
			jest.advanceTimersByTime( 250 );
		} );

		expect( mockValidateCropPixelRectAgainstBounds ).toHaveBeenCalledWith(
			expect.objectContaining( {
				width: 2560,
			} ),
			expect.objectContaining( {
				maxRight: 2560,
			} )
		);
	} );

	it( 'applies manual fine rotation changes from the advanced panel', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );
		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '30' } } );
		fireEvent.blur( rotationInput );

		expect( mockApplyOperation ).toHaveBeenCalledWith( {
			type: 'rotate',
			degrees: 30,
		} );
	} );

	it( 'clamps manual fine rotation changes to the rotation bounds', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );
		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '47' } } );
		fireEvent.blur( rotationInput );

		expect( mockApplyOperation ).toHaveBeenCalledWith( {
			type: 'rotate',
			degrees: 44.99,
		} );
	} );
} );
