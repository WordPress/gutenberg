/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import {
	DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
	ImageEditingSessionProvider,
	useImageEditingSession,
} from '..';
import { useCropper } from '../../../image-editor';
import { buildModifiers } from '../../media-editor-modal/build-modifiers';

const TEST_IMAGE = {
	src: 'test.jpg',
	width: 1000,
	height: 500,
};

const NEXT_IMAGE = {
	src: 'next.jpg',
	width: 1200,
	height: 800,
};

function SessionWrapper( { children }: { children: ReactNode } ) {
	return (
		<ImageEditingSessionProvider>{ children }</ImageEditingSessionProvider>
	);
}

function setup() {
	return renderHook( () => useImageEditingSession(), {
		wrapper: SessionWrapper,
	} );
}

describe( 'ImageEditingSessionProvider', () => {
	it( 'starts with a clean session', () => {
		const { result } = setup();

		expect( result.current.isDirty ).toBe( false );
		expect( result.current.hasPreviewOnlyEdits ).toBe( false );
		expect( result.current.hasReplacementImageEdits ).toBe( false );
		expect( result.current.hasUndo ).toBe( false );
		expect( result.current.hasRedo ).toBe( false );
		expect( result.current.sourceImage ).toBeNull();
		expect( result.current.workingImage ).toBeNull();
	} );

	it( 'tracks the current working image without marking the session dirty', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );

		expect( result.current.sourceImage ).toEqual( TEST_IMAGE );
		expect( result.current.workingImage ).toEqual( {
			src: TEST_IMAGE.src,
			width: TEST_IMAGE.width,
			height: TEST_IMAGE.height,
		} );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'provides the session-owned cropper through the cropper context', () => {
		const { result } = renderHook(
			() => ( {
				session: useImageEditingSession(),
				cropper: useCropper(),
			} ),
			{ wrapper: SessionWrapper }
		);

		expect( result.current.cropper ).toBe( result.current.session.cropper );
	} );

	it( 'resets cropper edits when the source image changes', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );
		act( () => {
			result.current.cropper.setZoom( 3 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.isDirty ).toBe( true );
		expect( result.current.hasUndo ).toBe( true );

		act( () => {
			result.current.setSourceImage( NEXT_IMAGE );
		} );

		expect( result.current.sourceImage ).toEqual( NEXT_IMAGE );
		expect( result.current.workingImage ).toEqual( NEXT_IMAGE );
		expect( result.current.cropper.state.image ).toEqual( {
			src: NEXT_IMAGE.src,
			naturalWidth: NEXT_IMAGE.width,
			naturalHeight: NEXT_IMAGE.height,
		} );
		expect( result.current.cropper.state.zoom ).toBe( 1 );
		expect( result.current.isDirty ).toBe( false );
		expect( result.current.hasUndo ).toBe( false );
		expect( result.current.hasRedo ).toBe( false );
	} );

	it( 'clears session history when the cropper image changes directly', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );
		act( () => {
			result.current.cropper.setZoom( 3 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.hasUndo ).toBe( true );

		act( () => {
			result.current.cropper.setImage( {
				src: NEXT_IMAGE.src,
				naturalWidth: NEXT_IMAGE.width,
				naturalHeight: NEXT_IMAGE.height,
			} );
		} );

		expect( result.current.hasUndo ).toBe( false );
		expect( result.current.hasRedo ).toBe( false );
	} );

	it( 'marks the image session dirty when cropper state changes', () => {
		const { result } = setup();

		act( () => {
			result.current.cropper.setZoom( 3 );
		} );

		expect( result.current.isDirty ).toBe( true );
		expect( result.current.hasPreviewOnlyEdits ).toBe( false );
	} );

	it( 'marks adjustment changes as replacement image edits', () => {
		const { result } = setup();

		act( () => {
			result.current.setAdjustment( 'brightness', 1.25 );
		} );

		expect( result.current.adjustments.brightness ).toBe( 1.25 );
		expect( result.current.isDirty ).toBe( true );
		expect( result.current.hasPreviewOnlyEdits ).toBe( false );
		expect( result.current.hasReplacementImageEdits ).toBe( true );
	} );

	it( 'does not create adjustment history before the control gesture commits', () => {
		jest.useFakeTimers();
		try {
			const { result } = setup();

			act( () => {
				result.current.setAdjustment( 'brightness', 1.25 );
			} );
			act( () => {
				jest.advanceTimersByTime( 300 );
			} );

			expect( result.current.isDirty ).toBe( true );
			expect( result.current.hasUndo ).toBe( false );

			act( () => {
				result.current.commitHistory();
			} );

			expect( result.current.hasUndo ).toBe( true );

			act( () => {
				result.current.undo();
			} );

			expect( result.current.adjustments ).toEqual(
				DEFAULT_IMAGE_EDITING_ADJUSTMENTS
			);
			expect( result.current.hasUndo ).toBe( false );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'keeps one adjustment history entry for a long-running control gesture', () => {
		jest.useFakeTimers();
		try {
			const { result } = setup();

			act( () => {
				result.current.setAdjustment( 'brightness', 1.1 );
			} );
			act( () => {
				jest.advanceTimersByTime( 300 );
			} );
			act( () => {
				result.current.setAdjustment( 'brightness', 1.2 );
			} );
			act( () => {
				jest.advanceTimersByTime( 300 );
			} );
			act( () => {
				result.current.setAdjustment( 'brightness', 1.3 );
			} );
			act( () => {
				jest.advanceTimersByTime( 300 );
			} );

			expect( result.current.hasUndo ).toBe( false );

			act( () => {
				result.current.commitHistory();
			} );

			expect( result.current.hasUndo ).toBe( true );

			act( () => {
				result.current.undo();
			} );

			expect( result.current.adjustments ).toEqual(
				DEFAULT_IMAGE_EDITING_ADJUSTMENTS
			);
			expect( result.current.hasUndo ).toBe( false );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'undoes and redoes adjustment edits through the session', () => {
		const { result } = setup();

		act( () => {
			result.current.setAdjustment( 'contrast', 1.4 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.hasUndo ).toBe( true );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.adjustments.contrast ).toBe( 1 );
		expect( result.current.hasRedo ).toBe( true );

		act( () => {
			result.current.redo();
		} );

		expect( result.current.adjustments.contrast ).toBe( 1.4 );
		expect( result.current.hasRedo ).toBe( false );
	} );

	it( 'composes rapid adjustment edits without losing earlier values', () => {
		const { result } = setup();

		act( () => {
			result.current.setAdjustment( 'brightness', 1.2 );
			result.current.setAdjustment( 'contrast', 1.3 );
			result.current.setAdjustment( 'saturation', 0.8 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.adjustments ).toEqual( {
			...DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
			brightness: 1.2,
			contrast: 1.3,
			saturation: 0.8,
		} );
	} );

	it( 'undoes committed adjustment edits one value change at a time', () => {
		const { result } = setup();

		act( () => {
			result.current.setAdjustment( 'brightness', 1.2 );
		} );
		act( () => {
			result.current.commitHistory();
		} );
		act( () => {
			result.current.setAdjustment( 'contrast', 1.3 );
		} );
		act( () => {
			result.current.commitHistory();
		} );
		act( () => {
			result.current.setAdjustment( 'saturation', 0.8 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.adjustments ).toEqual( {
			...DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
			brightness: 1.2,
			contrast: 1.3,
			saturation: 0.8,
		} );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.adjustments ).toEqual( {
			...DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
			brightness: 1.2,
			contrast: 1.3,
		} );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.adjustments ).toEqual( {
			...DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
			brightness: 1.2,
		} );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.adjustments ).toEqual(
			DEFAULT_IMAGE_EDITING_ADJUSTMENTS
		);
		expect( result.current.hasUndo ).toBe( false );
	} );

	it( 'preserves edit order across cropper and multiple adjustment entries', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );
		const initialCropRect = result.current.cropper.state.cropRect;

		act( () => {
			result.current.cropper.setCropRect( {
				x: 0.2,
				y: 0.2,
				width: 0.6,
				height: 0.6,
			} );
		} );
		act( () => {
			result.current.commitHistory();
		} );
		act( () => {
			result.current.setAdjustment( 'contrast', 1.3 );
		} );
		act( () => {
			result.current.commitHistory();
		} );
		act( () => {
			result.current.setAdjustment( 'brightness', 1.2 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.adjustments ).toEqual( {
			...DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
			contrast: 1.3,
		} );
		expect( result.current.cropper.state.cropRect ).not.toEqual(
			initialCropRect
		);

		act( () => {
			result.current.undo();
		} );

		expect( result.current.adjustments ).toEqual(
			DEFAULT_IMAGE_EDITING_ADJUSTMENTS
		);
		expect( result.current.cropper.state.cropRect ).not.toEqual(
			initialCropRect
		);

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.cropRect ).toEqual(
			initialCropRect
		);
		expect( result.current.adjustments ).toEqual(
			DEFAULT_IMAGE_EDITING_ADJUSTMENTS
		);

		act( () => {
			result.current.redo();
		} );

		expect( result.current.cropper.state.cropRect ).not.toEqual(
			initialCropRect
		);
		expect( result.current.adjustments ).toEqual(
			DEFAULT_IMAGE_EDITING_ADJUSTMENTS
		);

		act( () => {
			result.current.redo();
		} );

		expect( result.current.adjustments ).toEqual( {
			...DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
			contrast: 1.3,
		} );

		act( () => {
			result.current.redo();
		} );

		expect( result.current.adjustments ).toEqual( {
			...DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
			contrast: 1.3,
			brightness: 1.2,
		} );
	} );

	it( 'undoes adjustment edits after earlier cropper edits', () => {
		const { result } = setup();

		act( () => {
			result.current.cropper.setZoom( 2 );
		} );
		act( () => {
			result.current.commitHistory();
		} );
		act( () => {
			result.current.setAdjustment( 'brightness', 1.2 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.hasUndo ).toBe( true );
		expect( result.current.adjustments.brightness ).toBe( 1.2 );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.zoom ).toBe( 2 );
		expect( result.current.adjustments.brightness ).toBe( 1 );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.zoom ).toBe( 1 );
		expect( result.current.adjustments.brightness ).toBe( 1 );
		expect( result.current.hasUndo ).toBe( false );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.zoom ).toBe( 1 );
		expect( result.current.adjustments.brightness ).toBe( 1 );
		expect( result.current.hasUndo ).toBe( false );
	} );

	it( 'does not create an extra undo entry after crop resize and adjustment', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );
		const initialCropRect = result.current.cropper.state.cropRect;

		act( () => {
			result.current.cropper.setCropRect( {
				x: 0.2,
				y: 0.2,
				width: 0.6,
				height: 0.6,
			} );
		} );
		act( () => {
			result.current.commitHistory();
		} );
		act( () => {
			result.current.setAdjustment( 'brightness', 1.2 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.adjustments.brightness ).toBe( 1 );
		expect( result.current.cropper.state.cropRect ).not.toEqual(
			initialCropRect
		);

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.cropRect ).toEqual(
			initialCropRect
		);
		expect( result.current.hasUndo ).toBe( false );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.cropRect ).toEqual(
			initialCropRect
		);
		expect( result.current.cropper.state.image ).toEqual( {
			src: TEST_IMAGE.src,
			naturalWidth: TEST_IMAGE.width,
			naturalHeight: TEST_IMAGE.height,
		} );
		expect( result.current.adjustments.brightness ).toBe( 1 );
		expect( result.current.hasUndo ).toBe( false );
	} );

	it( 'undoes cropper edits after earlier adjustment edits', () => {
		const { result } = setup();

		act( () => {
			result.current.setAdjustment( 'brightness', 1.2 );
		} );
		act( () => {
			result.current.commitHistory();
		} );
		act( () => {
			result.current.cropper.setZoom( 2 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.zoom ).toBe( 1 );
		expect( result.current.adjustments.brightness ).toBe( 1.2 );
	} );

	it( 'resets adjustments when the source image changes', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );
		act( () => {
			result.current.setAdjustment( 'saturation', 0.5 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.hasReplacementImageEdits ).toBe( true );
		expect( result.current.hasUndo ).toBe( true );

		act( () => {
			result.current.setSourceImage( NEXT_IMAGE );
		} );

		expect( result.current.adjustments.saturation ).toBe( 1 );
		expect( result.current.hasPreviewOnlyEdits ).toBe( false );
		expect( result.current.hasReplacementImageEdits ).toBe( false );
		expect( result.current.hasUndo ).toBe( false );
	} );

	it( 'undoes and redoes cropper edits through the session', () => {
		const { result } = setup();

		act( () => {
			result.current.cropper.setZoom( 3 );
		} );
		act( () => {
			result.current.commitHistory();
		} );

		expect( result.current.isDirty ).toBe( true );
		expect( result.current.hasUndo ).toBe( true );

		act( () => {
			result.current.undo();
		} );

		expect( result.current.cropper.state.zoom ).toBe( 1 );
		expect( result.current.isDirty ).toBe( false );
		expect( result.current.hasRedo ).toBe( true );

		act( () => {
			result.current.redo();
		} );

		expect( result.current.cropper.state.zoom ).toBe( 3 );
		expect( result.current.isDirty ).toBe( true );
		expect( result.current.hasRedo ).toBe( false );
	} );

	it( 'resets cropper edits through the session', () => {
		const { result } = setup();

		act( () => {
			result.current.cropper.setZoom( 3 );
		} );

		expect( result.current.isDirty ).toBe( true );

		act( () => {
			result.current.reset();
		} );

		expect( result.current.cropper.state.zoom ).toBe( 1 );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'builds no save modifiers for a clean session', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );

		expect( result.current.buildSaveModifiers() ).toEqual( [] );
	} );

	it( 'builds the same save modifiers as the cropper modifier helper', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );
		act( () => {
			result.current.cropper.snapRotate90( 1 );
		} );

		expect( result.current.buildSaveModifiers() ).toEqual(
			buildModifiers( result.current.cropper.state, {
				width: TEST_IMAGE.width,
				height: TEST_IMAGE.height,
			} )
		);
	} );

	it( 'builds no save modifiers when replacement image edits are dirty', () => {
		const { result } = setup();

		act( () => {
			result.current.setSourceImage( TEST_IMAGE );
		} );
		act( () => {
			result.current.cropper.snapRotate90( 1 );
		} );
		act( () => {
			result.current.setAdjustment( 'brightness', 1.2 );
		} );

		expect( result.current.buildSaveModifiers() ).toEqual( [] );
	} );
} );
