/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

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
const mockApplyCropEdit = jest.fn( ( rect, field, value ) => {
	const next = { ...rect, [ field ]: value };
	return {
		...next,
		right: next.left + next.width,
		bottom: next.top + next.height,
	};
} );
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
	applyCropEdit: ( ...args: Parameters< typeof mockApplyCropEdit > ) =>
		mockApplyCropEdit( ...args ),
	cropPixelRectToNormalizedRect: (
		...args: Parameters< typeof mockCropPixelRectToNormalizedRect >
	) => mockCropPixelRectToNormalizedRect( ...args ),
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

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.objectContaining( {
				left: 100,
				top: 50,
				width: 400,
				height: 200,
			} ),
			'width',
			600,
			expect.objectContaining( {
				bounds: expect.objectContaining( {
					maxRight: 1000,
					maxBottom: 500,
				} ),
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

		expect( mockApplyCropEdit ).not.toHaveBeenCalled();
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

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.any( Object ),
			'width',
			1000,
			expect.objectContaining( {
				bounds: expect.objectContaining( { maxWidth: 1000 } ),
			} )
		);
		expect( mockSetCropRect ).toHaveBeenCalledWith( mockNormalizedRect );
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not settle while the user is still typing', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '600' } } );
		fireEvent.change( widthInput, { target: { value: '650' } } );

		// Live commits update the preview, but settle waits for explicit
		// completion so the cropper cannot reshape state mid-edit.
		expect( mockSetCropRect ).toHaveBeenCalled();
		expect( mockSettleCrop ).not.toHaveBeenCalled();

		fireEvent.blur( widthInput );

		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'leaves out-of-range crop drafts editable until blur', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );
		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '9999' } } );

		// Draft stays exactly as typed; nothing fires until the user signals
		// completion explicitly.
		expect( widthInput ).toHaveValue( 9999 );
		expect( mockApplyCropEdit ).not.toHaveBeenCalled();
		expect( mockSettleCrop ).not.toHaveBeenCalled();

		fireEvent.blur( widthInput );

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.any( Object ),
			'width',
			1000,
			expect.objectContaining( {
				bounds: expect.objectContaining( { maxWidth: 1000 } ),
			} )
		);
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps a focused crop input unchanged when external crop state changes', () => {
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

		// Focused inputs are sovereign: external state changes leave the
		// displayed value alone until the user blurs.
		expect( screen.getByLabelText( 'Width' ) ).toHaveValue( 400 );
	} );

	it( 'keeps an in-progress draft when external crop state changes', () => {
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

		expect( screen.getByLabelText( 'Width' ) ).toHaveValue( 600 );
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

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.any( Object ),
			'width',
			2560,
			expect.objectContaining( {
				bounds: expect.objectContaining( {
					maxRight: 2559.999999999,
				} ),
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

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.objectContaining( { left: 0.5 } ),
			'width',
			1350,
			expect.objectContaining( {
				bounds: expect.objectContaining( {
					maxRight: 1350,
					maxWidth: 1350,
				} ),
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

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.any( Object ),
			'left',
			0,
			expect.objectContaining( {
				bounds: expect.objectContaining( { minLeft: 0.000000001 } ),
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

		expect( mockSetRotation ).toHaveBeenCalledWith( 44.99 );
	} );
} );
