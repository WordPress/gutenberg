import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { logged } from '@wordpress/deprecated';
import { ImageCropperProvider } from '@wordpress/image-cropper';
import type { ReactNode } from 'react';
import useTransformImage from '../use-transform-image';

// The provider logs this once. Mark it logged so the console stays quiet.
const CROPPER_DEPRECATION_MESSAGE =
	'@wordpress/image-cropper is deprecated. Please use @wordpress/image-editor instead. Note: Build new croppers on its ImageEditorCanvas and useImageEditor. This package now wraps them and will be removed in a later release.';

const IMAGE = { url: 'photo.jpg', naturalWidth: 1200, naturalHeight: 600 };

function renderTransform() {
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<ImageCropperProvider>{ children }</ImageCropperProvider>
	);
	return renderHook( () => useTransformImage( IMAGE ), { wrapper } );
}

describe( 'useTransformImage', () => {
	beforeEach( () => {
		logged[ CROPPER_DEPRECATION_MESSAGE ] = true;
	} );

	it( 'starts from the image ratio with no rotation', () => {
		const { result } = renderTransform();

		expect( result.current.rotation ).toBe( 0 );
		expect( result.current.aspect ).toBe( 2 );
		expect( result.current.defaultAspect ).toBe( 2 );
	} );

	it( 'turns a quarter clockwise and follows the image orientation at the default ratio', () => {
		const { result } = renderTransform();

		act( () => result.current.rotateClockwise() );

		expect( result.current.rotation ).toBe( 90 );
		expect( result.current.aspect ).toBe( 0.5 );
	} );

	it( 'keeps a chosen zoom and ratio when turning', () => {
		const { result } = renderTransform();
		act( () => result.current.setZoom( 1.5 ) );

		act( () => result.current.rotateClockwise() );

		expect( result.current.rotation ).toBe( 90 );
		expect( result.current.aspect ).toBe( 2 );
		expect( result.current.zoom ).toBe( 1.5 );
	} );

	it( 'returns to the start after four turns', () => {
		const { result } = renderTransform();

		for ( let i = 0; i < 4; i++ ) {
			act( () => result.current.rotateClockwise() );
		}

		expect( result.current.rotation ).toBe( 0 );
		expect( result.current.aspect ).toBe( 2 );
	} );
} );
