/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import CropAdvancedPanel from '../crop-advanced-panel';

const mockSetCropRect = jest.fn();
const mockSetRotation = jest.fn();
const mockSettleCrop = jest.fn();
const mockCommitHistory = jest.fn();
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
	useCropper: () => ( {
		state: mockCropperState,
		setCropRect: mockSetCropRect,
		setRotation: mockSetRotation,
		settleCrop: mockSettleCrop,
		commitHistory: mockCommitHistory,
	} ),
} ) );

jest.mock( '../../../image-editor/core/crop-geometry', () => ( {
	cropPixelRectToNormalizedRect: (
		...args: Parameters< typeof mockCropPixelRectToNormalizedRect >
	) => mockCropPixelRectToNormalizedRect( ...args ),
	validateCropPixelRectAgainstBounds: (
		...args: Parameters< typeof mockValidateCropPixelRectAgainstBounds >
	) => mockValidateCropPixelRectAgainstBounds( ...args ),
} ) );

jest.mock( '../../../image-editor/react/hooks/use-crop-geometry', () => ( {
	useCropGeometry: () => mockCropGeometry,
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
		expect( mockSetCropRect ).toHaveBeenCalledWith( mockNormalizedRect );
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not apply out-of-range numeric crop drafts before completion', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '1' } } );

		expect( mockValidateCropPixelRectAgainstBounds ).not.toHaveBeenCalled();
		expect( mockSetCropRect ).not.toHaveBeenCalled();
		expect( mockSettleCrop ).not.toHaveBeenCalled();
	} );

	it( 'clamps completed crop edits to the nearest input bound', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '9999' } } );
		fireEvent.blur( widthInput );

		expect( mockValidateCropPixelRectAgainstBounds ).toHaveBeenCalledWith(
			expect.objectContaining( {
				width: 1000,
			} ),
			expect.objectContaining( {
				maxWidth: 1000,
			} )
		);
		expect( mockSetCropRect ).toHaveBeenCalledWith( mockNormalizedRect );
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'settles crop edits after the input is idle while focused', () => {
		jest.useFakeTimers();
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '600' } } );

		expect( mockSetCropRect ).toHaveBeenCalledWith( mockNormalizedRect );
		expect( mockSettleCrop ).not.toHaveBeenCalled();

		act( () => {
			jest.advanceTimersByTime( 300 );
		} );

		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'clamps out-of-range crop edits after the input is idle while focused', () => {
		jest.useFakeTimers();
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '9999' } } );

		expect( mockValidateCropPixelRectAgainstBounds ).not.toHaveBeenCalled();

		act( () => {
			jest.advanceTimersByTime( 300 );
		} );

		expect( widthInput ).toHaveValue( 1000 );
		expect( mockValidateCropPixelRectAgainstBounds ).toHaveBeenCalledWith(
			expect.objectContaining( {
				width: 1000,
			} ),
			expect.objectContaining( {
				maxWidth: 1000,
			} )
		);
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'updates a focused crop input when external crop state changes', () => {
		const { rerender } = render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );

		setMockCropGeometry( {
			rect: {
				width: 250,
				right: 350,
			},
		} );
		rerender( <CropAdvancedPanel freeformCrop /> );

		expect( screen.getByLabelText( 'Width' ) ).toHaveValue( 250 );
	} );

	it( 'updates a focused crop input with a draft when external crop state changes', () => {
		const { rerender } = render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '600' } } );

		setMockCropGeometry( {
			rect: {
				width: 250,
				right: 350,
			},
		} );
		rerender( <CropAdvancedPanel freeformCrop /> );

		expect( screen.getByLabelText( 'Width' ) ).toHaveValue( 250 );
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
		const leftInput = screen.getByLabelText( 'Crop horizontal position' );
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

	it( 'applies manual fine rotation changes from the advanced panel', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );
		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '30' } } );
		fireEvent.blur( rotationInput );

		expect( mockSetRotation ).toHaveBeenCalledWith( 30 );
		expect( mockCommitHistory ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'displays manual fine rotation half-degree values', () => {
		setMockCropperState( {
			rotation: 12.5,
		} );
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );

		expect( screen.getByLabelText( 'Fine rotation angle' ) ).toHaveValue(
			12.5
		);
	} );

	it( 'uses half-degree steps for manual fine rotation', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );

		expect(
			screen.getByLabelText( 'Fine rotation angle' )
		).toHaveAttribute( 'step', '0.5' );
	} );

	it( 'allows manual fine rotation half-degree changes', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );
		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '12.5' } } );
		fireEvent.blur( rotationInput );

		expect( mockSetRotation ).toHaveBeenCalledWith( 12.5 );
	} );

	it( 'snaps manual fine rotation changes to half-degree increments', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );
		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '12.3' } } );
		fireEvent.blur( rotationInput );

		expect( mockSetRotation ).toHaveBeenCalledWith( 12.5 );
	} );

	it( 'clamps manual fine rotation changes to the rotation bounds', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );
		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '47' } } );
		fireEvent.blur( rotationInput );

		expect( mockSetRotation ).toHaveBeenCalledWith( 44.5 );
	} );
} );
