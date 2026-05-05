/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { ImageEditingSessionProvider, useImageEditingSession } from '..';
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

	it( 'marks the image session dirty when cropper state changes', () => {
		const { result } = setup();

		act( () => {
			result.current.cropper.setZoom( 3 );
		} );

		expect( result.current.isDirty ).toBe( true );
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
} );
