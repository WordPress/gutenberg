/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useMediaEditorState } from '../use-media-editor-state';

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 1200,
	naturalHeight: 600,
};

function setupHook( visualSize = { width: 600, height: 400 } ) {
	const view = renderHook( () =>
		useMediaEditorState( { cropper: { image: IMAGE } } )
	);
	act( () => {
		view.result.current.setVisualSize( visualSize );
	} );
	return view;
}

describe( 'useMediaEditorState', () => {
	describe( 'initial state', () => {
		it( 'starts with default cropOptions', () => {
			const { result } = renderHook( () => useMediaEditorState() );

			expect( result.current.cropOptions.aspectRatioValue ).toBe( '0' );
		} );

		it( 'merges initial cropper and cropOptions overrides', () => {
			const { result } = renderHook( () =>
				useMediaEditorState( {
					cropper: { image: IMAGE },
					cropOptions: { aspectRatioValue: '1' },
				} )
			);

			expect( result.current.state.image ).toEqual( IMAGE );
			expect( result.current.cropOptions ).toEqual( {
				aspectRatioValue: '1',
			} );
		} );

		it( 'starts with isDirty=false and no undo / redo', () => {
			const { result } = setupHook();

			expect( result.current.isDirty ).toBe( false );
			expect( result.current.isCropperDirty ).toBe( false );
			expect( result.current.hasUndo ).toBe( false );
			expect( result.current.hasRedo ).toBe( false );
		} );
	} );

	describe( 'history — undo / redo across slices', () => {
		it( 'records the pre-state of each action and undoes it', () => {
			const { result } = setupHook();

			act( () => result.current.setRotation( 45 ) );

			expect( result.current.state.rotation ).toBe( 45 );
			expect( result.current.hasUndo ).toBe( true );

			act( () => result.current.undo() );

			expect( result.current.state.rotation ).toBe( 0 );
			expect( result.current.hasUndo ).toBe( false );
			expect( result.current.hasRedo ).toBe( true );
		} );

		it( 'redo re-applies an undone action', () => {
			const { result } = setupHook();

			act( () => result.current.setRotation( 45 ) );
			act( () => result.current.undo() );
			act( () => result.current.redo() );

			expect( result.current.state.rotation ).toBe( 45 );
		} );

		it( 'redo stack clears on a new action after undo', () => {
			const { result } = setupHook();

			act( () => result.current.setRotation( 45 ) );
			act( () => result.current.undo() );
			act( () => result.current.setRotation( 90 ) );

			expect( result.current.hasRedo ).toBe( false );
		} );

		it( 'no-op actions do not record history entries', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '0' ) );

			expect( result.current.hasUndo ).toBe( false );
		} );

		it( 'a single undo restores both cropOptions and cropRect after aspect-ratio change', () => {
			const { result } = setupHook();
			const initialCropRect = result.current.state.cropRect;
			const initialPreset = result.current.cropOptions.aspectRatioValue;

			act( () => result.current.setAspectRatioValue( '1' ) ); // Square

			// Both slices changed atomically: preset key and cropRect.
			expect( result.current.cropOptions.aspectRatioValue ).toBe( '1' );
			expect( result.current.state.cropRect ).not.toEqual(
				initialCropRect
			);
			expect( result.current.isCropperDirty ).toBe( true );
			// Only ONE undo entry — atomic transaction.
			expect( result.current.hasUndo ).toBe( true );

			act( () => result.current.undo() );

			expect( result.current.cropOptions.aspectRatioValue ).toBe(
				initialPreset
			);
			expect( result.current.state.cropRect ).toEqual( initialCropRect );
		} );
	} );

	describe( 'gestures — coalesce many changes into one undo entry', () => {
		it( 'coalesces all changes between beginGesture and endGesture', () => {
			const { result } = setupHook();

			act( () => result.current.beginGesture() );
			act( () => result.current.setRotation( 10 ) );
			act( () => result.current.setRotation( 20 ) );
			act( () => result.current.setRotation( 30 ) );
			act( () => result.current.endGesture() );

			expect( result.current.state.rotation ).toBe( 30 );
			expect( result.current.hasUndo ).toBe( true );

			// One undo restores all the way to the pre-gesture state.
			act( () => result.current.undo() );
			expect( result.current.state.rotation ).toBe( 0 );
		} );

		it( 'an empty gesture (no changes) records no history', () => {
			const { result } = setupHook();

			act( () => result.current.beginGesture() );
			act( () => result.current.endGesture() );

			expect( result.current.hasUndo ).toBe( false );
		} );

		it( 'undo during an open gesture flushes the gesture first', () => {
			const { result } = setupHook();

			act( () => result.current.beginGesture() );
			act( () => result.current.setRotation( 45 ) );
			// Undo without endGesture should still flush the in-flight change.
			act( () => result.current.undo() );

			expect( result.current.state.rotation ).toBe( 0 );
			expect( result.current.hasRedo ).toBe( true );
		} );

		it( 'keeps the original gesture snapshot if beginGesture is called repeatedly', () => {
			const { result } = setupHook();

			act( () => {
				result.current.beginGesture();
				result.current.setRotation( 10 );
				result.current.beginGesture();
				result.current.setRotation( 20 );
				result.current.endGesture();
			} );

			expect( result.current.state.rotation ).toBe( 20 );

			act( () => result.current.undo() );

			expect( result.current.state.rotation ).toBe( 0 );
		} );

		it( 'does not record a gesture that returns to its starting state', () => {
			const { result } = setupHook();

			act( () => {
				result.current.beginGesture();
				result.current.setRotation( 10 );
				result.current.setRotation( 0 );
				result.current.endGesture();
			} );

			expect( result.current.state.rotation ).toBe( 0 );
			expect( result.current.hasUndo ).toBe( false );
		} );
	} );

	describe( 'SET_ASPECT_RATIO_VALUE atomicity', () => {
		it( 'reshapes cropRect when a fixed ratio is selected with visualSize > 0', () => {
			const { result } = setupHook( { width: 600, height: 400 } );

			act( () => result.current.setAspectRatioValue( '1' ) ); // Square

			// At visualSize 600x400, the inscribed square has w/h such that
			// pixel ratio = 1. normalizedRatio = 1 * 400 / 600 = 0.666...
			// So normalized w = 0.666..., h = 1.
			expect( result.current.state.cropRect.width ).toBeCloseTo(
				2 / 3,
				5
			);
			expect( result.current.state.cropRect.height ).toBeCloseTo( 1, 5 );
		} );

		it( 'Free leaves the cropRect alone', () => {
			const { result } = setupHook();
			const original = result.current.state.cropRect;

			// User-picked custom crop first.
			act( () =>
				result.current.setCropRect( {
					x: 0.1,
					y: 0.1,
					width: 0.5,
					height: 0.5,
				} )
			);
			const beforeFree = result.current.state.cropRect;

			// Switch to Free — cropRect should NOT snap back to anything.
			act( () => result.current.setAspectRatioValue( '0' ) );

			expect( result.current.state.cropRect ).toEqual( beforeFree );
			expect( original ).not.toEqual( beforeFree );
		} );

		it( 'resolves Original from the loaded image', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '-1' ) ); // Original

			// Image is 1200x600 = ratio 2. inscribedRect at visualSize 600x400:
			// normalizedRatio = 2 * 400 / 600 = 1.333... > 1, so h = 1/1.333 = 0.75.
			expect( result.current.state.cropRect.width ).toBeCloseTo( 1, 5 );
			expect( result.current.state.cropRect.height ).toBeCloseTo(
				0.75,
				5
			);
		} );

		it( 'groups cropper reset and cropOptions reset in one undo step', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '1' ) );
			act( () => result.current.setRotation( 45 ) );

			act( () => {
				result.current.beginGesture();
				result.current.reset();
				result.current.resetCropOptions();
				result.current.endGesture();
			} );

			expect( result.current.state.rotation ).toBe( 0 );
			expect( result.current.cropOptions ).toEqual( {
				aspectRatioValue: '0',
			} );

			act( () => result.current.undo() );

			expect( result.current.state.rotation ).toBe( 45 );
			expect( result.current.cropOptions ).toEqual( {
				aspectRatioValue: '1',
			} );
		} );
	} );

	describe( 'viewport reshape is silent', () => {
		it( 'adjustCropRectForViewport does NOT record an undo entry', () => {
			const { result } = setupHook();

			act( () =>
				result.current.adjustCropRectForViewport( {
					x: 0,
					y: 0,
					width: 0.5,
					height: 0.5,
				} )
			);

			expect( result.current.hasUndo ).toBe( false );
		} );
	} );

	describe( 'setImage', () => {
		it( 'clears history and resets isDirty', () => {
			const { result } = setupHook();

			act( () => result.current.setRotation( 45 ) );
			expect( result.current.hasUndo ).toBe( true );
			expect( result.current.isDirty ).toBe( true );

			act( () =>
				result.current.setImage( {
					src: 'other.jpg',
					naturalWidth: 800,
					naturalHeight: 800,
				} )
			);

			expect( result.current.hasUndo ).toBe( false );
			expect( result.current.hasRedo ).toBe( false );
			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'does not clear history when the same image is reported again', () => {
			const { result } = setupHook();

			act( () => result.current.setRotation( 45 ) );
			expect( result.current.hasUndo ).toBe( true );
			expect( result.current.isCropperDirty ).toBe( true );

			act( () => result.current.setImage( IMAGE ) );

			expect( result.current.hasUndo ).toBe( true );
			expect( result.current.isCropperDirty ).toBe( true );
		} );
	} );
} );
