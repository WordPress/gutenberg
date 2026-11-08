import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaEditorState } from '../use-media-editor-state';

// The canvas refits the crop through this. It is on the controller, but
// not on its public type.
interface CanvasOnlyMethods {
	adjustCropRectForViewport: ( rect: {
		x: number;
		y: number;
		width: number;
		height: number;
	} ) => void;
}

function asCanvas( controller: unknown ): CanvasOnlyMethods {
	return controller as CanvasOnlyMethods;
}

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 1200,
	naturalHeight: 600,
};

// Loading the image through the session, as the canvas does, so the
// baseline and history start from the loaded image.
function setupHook() {
	const view = renderHook( () => useMediaEditorState() );
	act( () => view.result.current.setSourceImage( IMAGE ) );
	return view;
}

describe( 'useMediaEditorState', () => {
	describe( 'initial state', () => {
		it( 'starts with default cropOptions', () => {
			const { result } = renderHook( () => useMediaEditorState() );

			expect( result.current.cropOptions.aspectRatioValue ).toBe( '0' );
		} );

		it( 'starts with isDirty=false and no undo / redo', () => {
			const { result } = setupHook();

			expect( result.current.isDirty ).toBe( false );
			expect( result.current.imageEditor.isDirty ).toBe( false );
			expect( result.current.hasUndo ).toBe( false );
			expect( result.current.hasRedo ).toBe( false );
		} );
	} );

	describe( 'session edits versus image output edits', () => {
		it( 'counts an aspect-ratio preset change as a session edit only', () => {
			// Original locks the image's own 2:1 ratio, whose largest box is
			// the whole image, so the preset changes but the crop does not.
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '-1' ) );

			expect( result.current.isDirty ).toBe( true );
			expect( result.current.imageEditor.isDirty ).toBe( false );
			expect( result.current.hasOutputEdits ).toBe( false );
		} );

		it( 'counts a geometry change as an image output edit', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );

			expect( result.current.isDirty ).toBe( true );
			expect( result.current.imageEditor.isDirty ).toBe( true );
			expect( result.current.hasOutputEdits ).toBe( true );
		} );
	} );

	describe( 'history — undo / redo across slices', () => {
		it( 'records the pre-state of each action and undoes it', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );

			expect( result.current.imageEditor.state.rotation ).toBe( 45 );
			expect( result.current.hasUndo ).toBe( true );

			act( () => result.current.undo() );

			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
			expect( result.current.hasUndo ).toBe( false );
			expect( result.current.hasRedo ).toBe( true );
		} );

		it( 'redo re-applies an undone action', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );
			act( () => result.current.undo() );
			act( () => result.current.redo() );

			expect( result.current.imageEditor.state.rotation ).toBe( 45 );
		} );

		it( 'redo stack clears on a new action after undo', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );
			act( () => result.current.undo() );
			act( () => result.current.imageEditor.setRotation( 90 ) );

			expect( result.current.hasRedo ).toBe( false );
		} );

		it( 'no-op actions do not record history entries', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '0' ) );

			expect( result.current.hasUndo ).toBe( false );
		} );

		it( 'a single undo restores both cropOptions and cropRect after aspect-ratio change', () => {
			const { result } = setupHook();
			const initialCropRect = result.current.imageEditor.state.cropRect;
			const initialPreset = result.current.cropOptions.aspectRatioValue;

			act( () => result.current.setAspectRatioValue( '1' ) ); // Square

			// Both slices changed atomically: preset key, ratio and cropRect.
			expect( result.current.cropOptions.aspectRatioValue ).toBe( '1' );
			expect( result.current.imageEditor.state.aspectRatio ).toBe( 1 );
			expect( result.current.imageEditor.state.cropRect ).not.toEqual(
				initialCropRect
			);
			expect( result.current.imageEditor.isDirty ).toBe( true );
			// Only ONE undo entry — atomic transaction.
			expect( result.current.hasUndo ).toBe( true );

			act( () => result.current.undo() );

			expect( result.current.cropOptions.aspectRatioValue ).toBe(
				initialPreset
			);
			expect( result.current.imageEditor.state.cropRect ).toEqual(
				initialCropRect
			);
			expect(
				result.current.imageEditor.state.aspectRatio
			).toBeUndefined();
		} );
	} );

	describe( 'gestures — coalesce many changes into one undo entry', () => {
		it( 'coalesces all changes between beginGesture and endGesture', () => {
			const { result } = setupHook();

			act( () => result.current.beginGesture() );
			act( () => result.current.imageEditor.setRotation( 10 ) );
			act( () => result.current.imageEditor.setRotation( 20 ) );
			act( () => result.current.imageEditor.setRotation( 30 ) );
			act( () => result.current.endGesture() );

			expect( result.current.imageEditor.state.rotation ).toBe( 30 );
			expect( result.current.hasUndo ).toBe( true );

			// One undo restores all the way to the pre-gesture state.
			act( () => result.current.undo() );
			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
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
			act( () => result.current.imageEditor.setRotation( 45 ) );
			// Undo without endGesture should still flush the in-flight change.
			act( () => result.current.undo() );

			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
			expect( result.current.hasRedo ).toBe( true );
		} );

		it( 'keeps the original gesture snapshot if beginGesture is called repeatedly', () => {
			const { result } = setupHook();

			act( () => {
				result.current.beginGesture();
				result.current.imageEditor.setRotation( 10 );
				result.current.beginGesture();
				result.current.imageEditor.setRotation( 20 );
				result.current.endGesture();
			} );

			expect( result.current.imageEditor.state.rotation ).toBe( 20 );

			act( () => result.current.undo() );

			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
		} );

		it( 'does not record a gesture that returns to its starting state', () => {
			const { result } = setupHook();

			act( () => {
				result.current.beginGesture();
				result.current.imageEditor.setRotation( 10 );
				result.current.imageEditor.setRotation( 0 );
				result.current.endGesture();
			} );

			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
			expect( result.current.hasUndo ).toBe( false );
		} );
	} );

	describe( 'SET_ASPECT_RATIO_VALUE atomicity', () => {
		it( 'reshapes cropRect when a fixed ratio is selected', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '1' ) ); // Square

			// The image is 1200x600, so the largest square is half its
			// width and all of its height.
			expect(
				result.current.imageEditor.state.cropRect.width
			).toBeCloseTo( 0.5, 5 );
			expect(
				result.current.imageEditor.state.cropRect.height
			).toBeCloseTo( 1, 5 );
		} );

		it( 'Free leaves the cropRect alone', () => {
			const { result } = setupHook();
			const original = result.current.imageEditor.state.cropRect;

			// User-picked custom crop first.
			act( () =>
				result.current.imageEditor.setCropRect( {
					x: 0.1,
					y: 0.1,
					width: 0.5,
					height: 0.5,
				} )
			);
			const beforeFree = result.current.imageEditor.state.cropRect;

			// Switch to Free — cropRect should NOT snap back to anything.
			act( () => result.current.setAspectRatioValue( '0' ) );

			expect( result.current.imageEditor.state.cropRect ).toEqual(
				beforeFree
			);
			expect( original ).not.toEqual( beforeFree );
		} );

		it( 'resolves Original from the loaded image', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '-1' ) ); // Original

			// Image is 1200x600, so Original locks a 2:1 ratio, and the
			// largest 2:1 box is the whole image.
			expect( result.current.imageEditor.state.aspectRatio ).toBe( 2 );
			expect(
				result.current.imageEditor.state.cropRect.width
			).toBeCloseTo( 1, 5 );
			expect(
				result.current.imageEditor.state.cropRect.height
			).toBeCloseTo( 1, 5 );
		} );

		it( 'keeps a locked preset and crop together through two turns and undo/redo', () => {
			const { result } = setupHook();
			const preset = ( 16 / 9 ).toString();
			act( () => result.current.setAspectRatioValue( preset ) );
			const originalCrop = result.current.imageEditor.state.cropRect;
			const originalZoom = result.current.imageEditor.state.zoom;

			act( () => result.current.imageEditor.snapRotate90( 1 ) );
			const firstTurnCrop = result.current.imageEditor.state.cropRect;
			act( () => result.current.imageEditor.snapRotate90( 1 ) );
			const secondTurnCrop = result.current.imageEditor.state.cropRect;
			expect( result.current.cropOptions.aspectRatioValue ).toBe(
				preset
			);
			expect( secondTurnCrop.x ).toBeCloseTo( originalCrop.x, 10 );
			expect( secondTurnCrop.y ).toBeCloseTo( originalCrop.y, 10 );
			expect( secondTurnCrop.width ).toBeCloseTo(
				originalCrop.width,
				10
			);
			expect( secondTurnCrop.height ).toBeCloseTo(
				originalCrop.height,
				10
			);
			expect( result.current.imageEditor.state.zoom ).toBeCloseTo(
				originalZoom,
				6
			);

			act( () => result.current.undo() );
			expect( result.current.imageEditor.state.rotation ).toBe( 90 );
			expect( result.current.imageEditor.state.cropRect ).toEqual(
				firstTurnCrop
			);
			expect( result.current.cropOptions.aspectRatioValue ).toBe(
				preset
			);

			act( () => result.current.redo() );
			expect( result.current.imageEditor.state.rotation ).toBe( 180 );
			expect( result.current.imageEditor.state.cropRect ).toEqual(
				secondTurnCrop
			);
			expect( result.current.imageEditor.state.zoom ).toBeCloseTo(
				originalZoom,
				6
			);
		} );

		it( 'restores a panned image after four turns', () => {
			const { result } = setupHook();
			act( () =>
				result.current.setSourceImage( {
					src: 'four-by-three.jpg',
					naturalWidth: 1600,
					naturalHeight: 1200,
				} )
			);
			act( () =>
				result.current.setAspectRatioValue( ( 16 / 9 ).toString() )
			);
			act( () => result.current.imageEditor.setPan( { x: 0, y: 0.1 } ) );
			const originalPan = result.current.imageEditor.state.pan;

			for ( let i = 0; i < 4; i++ ) {
				act( () => result.current.imageEditor.snapRotate90( 1 ) );
			}

			expect( originalPan.y ).toBeCloseTo( 0.1, 6 );
			expect( result.current.imageEditor.state.pan.x ).toBeCloseTo(
				originalPan.x,
				6
			);
			expect( result.current.imageEditor.state.pan.y ).toBeCloseTo(
				originalPan.y,
				6
			);
		} );
	} );

	describe( 'reset', () => {
		it( 'puts geometry, crop options and edits back to their starting state', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '1' ) );
			act( () => result.current.imageEditor.setRotation( 45 ) );
			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);

			act( () => result.current.reset() );

			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
			expect( result.current.imageEditor.state.image ).toEqual( IMAGE );
			expect( result.current.cropOptions ).toEqual( {
				aspectRatioValue: '0',
			} );
			expect( result.current.edits ).toEqual( {} );
			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'is undone in one step', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '1' ) );
			act( () => result.current.imageEditor.setRotation( 45 ) );
			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);
			act( () => result.current.reset() );

			act( () => result.current.undo() );

			expect( result.current.imageEditor.state.rotation ).toBe( 45 );
			expect( result.current.cropOptions ).toEqual( {
				aspectRatioValue: '1',
			} );
			expect( result.current.edits ).toEqual( {
				'test/vignette': { amount: 0.5 },
			} );
		} );

		it( 'records no history on a clean session', () => {
			const { result } = setupHook();

			act( () => result.current.reset() );

			expect( result.current.hasUndo ).toBe( false );
		} );
	} );

	describe( 'viewport reshape is silent', () => {
		it( 'adjustCropRectForViewport does NOT record an undo entry', () => {
			const { result } = setupHook();

			act( () =>
				asCanvas(
					result.current.imageEditor
				).adjustCropRectForViewport( {
					x: 0,
					y: 0,
					width: 0.5,
					height: 0.5,
				} )
			);

			expect( result.current.hasUndo ).toBe( false );
		} );
	} );

	describe( 'edits', () => {
		it( 'undoes and redoes an edit and a crop change in the order they were made', () => {
			const { result } = setupHook();

			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);
			act( () => result.current.imageEditor.setRotation( 45 ) );

			act( () => result.current.undo() );
			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
			expect( result.current.edits ).toEqual( {
				'test/vignette': { amount: 0.5 },
			} );

			act( () => result.current.undo() );
			expect( result.current.edits ).toEqual( {} );

			act( () => result.current.redo() );
			expect( result.current.edits ).toEqual( {
				'test/vignette': { amount: 0.5 },
			} );
			expect( result.current.imageEditor.state.rotation ).toBe( 0 );

			act( () => result.current.redo() );
			expect( result.current.imageEditor.state.rotation ).toBe( 45 );
		} );

		it( 'groups the edits made during a gesture into one undo entry', () => {
			const { result } = setupHook();

			act( () => result.current.beginGesture() );
			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.1 } )
			);
			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.2 } )
			);
			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.3 } )
			);
			act( () => result.current.endGesture() );

			expect( result.current.edits ).toEqual( {
				'test/vignette': { amount: 0.3 },
			} );

			act( () => result.current.undo() );

			expect( result.current.edits ).toEqual( {} );
			expect( result.current.hasUndo ).toBe( false );
		} );

		it( 'records no history when the new value is equal in content', () => {
			const { result } = setupHook();

			act( () =>
				result.current.setEdit( 'test/tint', { rgb: [ 255, 0, 0 ] } )
			);
			act( () =>
				result.current.setEdit( 'test/tint', { rgb: [ 255, 0, 0 ] } )
			);
			act( () => result.current.undo() );

			expect( result.current.edits ).toEqual( {} );
			expect( result.current.hasUndo ).toBe( false );
		} );

		it( 'is clean again once the edit is removed', () => {
			const { result } = setupHook();

			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);
			expect( result.current.isDirty ).toBe( true );

			act( () => result.current.setEdit( 'test/vignette', undefined ) );

			expect( result.current.edits ).toEqual( {} );
			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'makes the session dirty without counting as an image output edit', () => {
			const { result } = setupHook();

			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);

			expect( result.current.isDirty ).toBe( true );
			expect( result.current.imageEditor.isDirty ).toBe( false );
			expect( result.current.hasOutputEdits ).toBe( false );
		} );

		it( 'clears the edits when a different image is loaded', () => {
			const { result } = setupHook();

			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);
			act( () =>
				result.current.setSourceImage( {
					src: 'other.jpg',
					naturalWidth: 800,
					naturalHeight: 800,
				} )
			);

			expect( result.current.edits ).toEqual( {} );
			expect( result.current.isDirty ).toBe( false );
		} );
	} );

	describe( 'setSourceImage', () => {
		it( 'clears history and resets isDirty', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );
			expect( result.current.hasUndo ).toBe( true );
			expect( result.current.isDirty ).toBe( true );

			act( () =>
				result.current.setSourceImage( {
					src: 'other.jpg',
					naturalWidth: 800,
					naturalHeight: 800,
				} )
			);

			expect( result.current.hasUndo ).toBe( false );
			expect( result.current.hasRedo ).toBe( false );
			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'resets geometry and crop options for a new image', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );
			act( () => result.current.setAspectRatioValue( '1' ) );
			expect( result.current.imageEditor.state.rotation ).toBe( 45 );
			expect( result.current.cropOptions.aspectRatioValue ).toBe( '1' );

			act( () =>
				result.current.setSourceImage( {
					src: 'other.jpg',
					naturalWidth: 800,
					naturalHeight: 800,
				} )
			);

			// Edits made against one image must not survive onto another.
			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
			expect( result.current.cropOptions.aspectRatioValue ).toBe( '0' );
		} );

		it( 'starts a fresh session when the image editor reports a different image', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );
			act( () =>
				result.current.imageEditor.setImage( {
					src: 'other.jpg',
					naturalWidth: 800,
					naturalHeight: 800,
				} )
			);

			expect( result.current.imageEditor.state.image?.src ).toBe(
				'other.jpg'
			);
			expect( result.current.imageEditor.state.rotation ).toBe( 0 );
			expect( result.current.hasUndo ).toBe( false );
		} );

		it( 'does not clear history when the same image is reported again', () => {
			const { result } = setupHook();

			act( () => result.current.imageEditor.setRotation( 45 ) );
			expect( result.current.hasUndo ).toBe( true );
			expect( result.current.imageEditor.isDirty ).toBe( true );

			act( () => result.current.setSourceImage( IMAGE ) );

			expect( result.current.hasUndo ).toBe( true );
			expect( result.current.imageEditor.isDirty ).toBe( true );
		} );
	} );
} );
