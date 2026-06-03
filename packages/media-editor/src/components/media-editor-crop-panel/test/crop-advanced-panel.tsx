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
const mockBeginGesture = jest.fn();
const mockEndGesture = jest.fn();
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

jest.mock( '../../../state', () => ( {
	useMediaEditor: () => ( {
		state: mockCropperState,
		setCropRect: mockSetCropRect,
		setRotation: mockSetRotation,
		settleCrop: mockSettleCrop,
		beginGesture: mockBeginGesture,
		endGesture: mockEndGesture,
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

	it( 'wires the fine rotation field to the controls hook', () => {
		render( <CropAdvancedPanel freeformCrop /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Advanced' } ) );
		const rotationInput = screen.getByLabelText( 'Fine rotation angle' );
		fireEvent.focus( rotationInput );
		fireEvent.change( rotationInput, { target: { value: '30' } } );
		fireEvent.blur( rotationInput );

		expect( mockSetRotation ).toHaveBeenCalledWith( 30 );
	} );
} );
