import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaEditorState } from '../use-media-editor-state';

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 1200,
	naturalHeight: 600,
};

// Loading the image through the session, as the canvas does, so the
// baseline and history start from the loaded image.
function setupHook( visualSize = { width: 600, height: 400 } ) {
	const view = renderHook( () => useMediaEditorState() );
	act( () => {
		view.result.current.setSourceImage( IMAGE );
		view.result.current.cropper.setVisualSize( visualSize );
	} );
	return view;
}

describe( 'useMediaEditorState', () => {
	describe( 'session edits versus image output edits', () => {
		it( 'counts an aspect-ratio preset change as a session edit only', () => {
			// No visual size is reported, so picking a ratio changes the
			// preset without reshaping the crop.
			const { result } = renderHook( () => useMediaEditorState() );
			act( () => result.current.setSourceImage( IMAGE ) );

			act( () => result.current.setAspectRatioValue( '1' ) );

			expect( result.current.isDirty ).toBe( true );
			expect( result.current.cropper.isDirty ).toBe( false );
			expect( result.current.hasOutputEdits ).toBe( false );
		} );

		it( 'counts a geometry change as an image output edit', () => {
			const { result } = setupHook();

			act( () => result.current.cropper.setRotation( 45 ) );

			expect( result.current.isDirty ).toBe( true );
			expect( result.current.cropper.isDirty ).toBe( true );
			expect( result.current.hasOutputEdits ).toBe( true );
		} );
	} );

	describe( 'reset', () => {
		it( 'puts geometry, crop options and edits back to their starting state', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '1' ) );
			act( () => result.current.cropper.setRotation( 45 ) );
			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);

			act( () => result.current.reset() );

			expect( result.current.cropper.state.rotation ).toBe( 0 );
			expect( result.current.cropper.state.image ).toEqual( IMAGE );
			expect( result.current.cropOptions ).toEqual( {
				aspectRatioValue: '0',
			} );
			expect( result.current.edits ).toEqual( {} );
			expect( result.current.isDirty ).toBe( false );
		} );

		it( 'is undone in one step', () => {
			const { result } = setupHook();

			act( () => result.current.setAspectRatioValue( '1' ) );
			act( () => result.current.cropper.setRotation( 45 ) );
			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);
			act( () => result.current.reset() );

			act( () => result.current.undo() );

			expect( result.current.cropper.state.rotation ).toBe( 45 );
			expect( result.current.cropOptions ).toEqual( {
				aspectRatioValue: '1',
			} );
			expect( result.current.edits ).toEqual( {
				'test/vignette': { amount: 0.5 },
			} );
		} );
	} );

	describe( 'edits', () => {
		it( 'undoes and redoes an edit and a crop change in the order they were made', () => {
			const { result } = setupHook();

			act( () =>
				result.current.setEdit( 'test/vignette', { amount: 0.5 } )
			);
			act( () => result.current.cropper.setRotation( 45 ) );

			act( () => result.current.undo() );
			expect( result.current.cropper.state.rotation ).toBe( 0 );
			expect( result.current.edits ).toEqual( {
				'test/vignette': { amount: 0.5 },
			} );

			act( () => result.current.undo() );
			expect( result.current.edits ).toEqual( {} );

			act( () => result.current.redo() );
			expect( result.current.edits ).toEqual( {
				'test/vignette': { amount: 0.5 },
			} );
			expect( result.current.cropper.state.rotation ).toBe( 0 );

			act( () => result.current.redo() );
			expect( result.current.cropper.state.rotation ).toBe( 45 );
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
			expect( result.current.cropper.isDirty ).toBe( false );
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
} );
