/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import CropAdvancedPanel from '../crop-advanced-panel';

const mockSetCropRect = jest.fn();
const mockSetRotation = jest.fn();
const mockSettleCrop = jest.fn();
const mockCommitHistory = jest.fn();
const mockPauseHistory = jest.fn();
const mockResumeHistory = jest.fn();
const mockSetPreviewCropRect = jest.fn();
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
	pan: { x: 0, y: 0 },
	zoom: 1,
	cropRect: { x: 0.1, y: 0.1, width: 0.4, height: 0.4 },
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
const mockGetCropPixelRect = jest.fn( ( _state, imageSize ) => ( {
	left: 0,
	top: 0,
	width: imageSize.width,
	height: imageSize.height,
	right: imageSize.width,
	bottom: imageSize.height,
} ) );

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
		pauseHistory: mockPauseHistory,
	} ),
} ) );

jest.mock( '../../../image-editor/core/crop-geometry', () => ( {
	applyCropEdit: ( ...args: Parameters< typeof mockApplyCropEdit > ) =>
		mockApplyCropEdit( ...args ),
	cropPixelRectToNormalizedRect: (
		...args: Parameters< typeof mockCropPixelRectToNormalizedRect >
	) => mockCropPixelRectToNormalizedRect( ...args ),
	getCropPixelRect: ( ...args: Parameters< typeof mockGetCropPixelRect > ) =>
		mockGetCropPixelRect( ...args ),
} ) );

jest.mock( '../../../image-editor/react/hooks/use-crop-geometry', () => ( {
	useCropGeometry: () => mockCropGeometry,
} ) );

jest.mock( '../../../image-editor/react/components/cropper-provider', () => ( {
	useSetCropperPreviewRect: () => mockSetPreviewCropRect,
} ) );

describe( 'CropAdvancedPanel', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockPauseHistory.mockReturnValue( mockResumeHistory );
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
			900,
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

		// Draft edits update only the preview overlay until completion.
		expect( mockSetPreviewCropRect ).toHaveBeenCalled();
		expect( mockSetCropRect ).not.toHaveBeenCalled();
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
		expect( mockSetCropRect ).not.toHaveBeenCalled();
		expect( mockSettleCrop ).not.toHaveBeenCalled();

		fireEvent.blur( widthInput );

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.any( Object ),
			'width',
			900,
			expect.objectContaining( {
				bounds: expect.objectContaining( { maxWidth: 1000 } ),
			} )
		);
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'updates a focused crop input when external crop state changes', async () => {
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

		await waitFor( () =>
			expect( screen.getByLabelText( 'Width' ) ).toHaveValue( 250 )
		);
	} );

	it( 'cancels an in-progress crop preview when external crop state changes', async () => {
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

		await waitFor( () =>
			expect( screen.getByLabelText( 'Width' ) ).toHaveValue( 250 )
		);
		expect( mockSetPreviewCropRect ).toHaveBeenLastCalledWith( null );
	} );

	it( 'previews image-bound manual position edits without moving the cropper', () => {
		setMockCropGeometry( {
			rect: {
				top: -85,
				bottom: 115,
			},
			imageBounds: {
				minTop: -100,
				maxBottom: 500,
				maxHeight: 600,
			},
		} );
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const topInput = screen.getByLabelText( 'Crop vertical position' );
		fireEvent.focus( topInput );
		fireEvent.change( topInput, { target: { value: '-84' } } );

		expect( topInput ).toHaveValue( -84 );
		expect( mockSetPreviewCropRect ).toHaveBeenCalled();
		expect( mockSetCropRect ).not.toHaveBeenCalled();

		fireEvent.blur( topInput );

		expect( mockApplyCropEdit ).toHaveBeenCalledWith(
			expect.any( Object ),
			'top',
			-84,
			expect.objectContaining( {
				bounds: expect.objectContaining( { minTop: -100 } ),
			} )
		);
		expect( mockSetCropRect ).toHaveBeenCalledWith( mockNormalizedRect );
		expect( mockSettleCrop ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'treats near-integer maximum bounds as the expected integer pixel value', () => {
		setMockCropperState( {
			image: {
				naturalWidth: 2560,
			},
		} );
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
		setMockCropperState( {
			image: {
				naturalWidth: 1350,
			},
		} );
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

	it( 'does not pause history while crop fields only preview drafts', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );

		fireEvent.focus( widthInput );
		expect( mockPauseHistory ).not.toHaveBeenCalled();
		expect( mockResumeHistory ).not.toHaveBeenCalled();

		fireEvent.change( widthInput, { target: { value: '600' } } );
		fireEvent.change( widthInput, { target: { value: '700' } } );

		expect( mockPauseHistory ).not.toHaveBeenCalled();
		expect( mockResumeHistory ).not.toHaveBeenCalled();

		fireEvent.blur( widthInput );

		expect( mockResumeHistory ).not.toHaveBeenCalled();
	} );

	it( 'does not pause history for out-of-range crop drafts', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const widthInput = screen.getByLabelText( 'Width' );

		fireEvent.focus( widthInput );
		fireEvent.change( widthInput, { target: { value: '9999' } } );
		fireEvent.blur( widthInput );

		expect( mockPauseHistory ).not.toHaveBeenCalled();
		expect( mockResumeHistory ).not.toHaveBeenCalled();
	} );

	it( 'pauses fine rotation edits too', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );

		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '12.5' } } );
		fireEvent.blur( rotationInput );

		expect( mockPauseHistory ).toHaveBeenCalledTimes( 1 );
		expect( mockResumeHistory ).toHaveBeenCalledTimes( 1 );
	} );
} );
