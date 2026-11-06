import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { logged } from '@wordpress/deprecated';
import { areImageEditorStatesEqual } from '@wordpress/image-editor';
import type { ReactNode } from 'react';
import ImageCropperProvider, {
	DEPRECATION_MESSAGE,
	useImageCropper,
	useImageCropperInternals,
} from '..';

const SQUARE = { src: 'square.png', naturalWidth: 800, naturalHeight: 800 };
const WIDE = { src: 'wide.png', naturalWidth: 400, naturalHeight: 200 };

function renderCropper() {
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<ImageCropperProvider>{ children }</ImageCropperProvider>
	);
	return renderHook(
		() => ( {
			cropper: useImageCropper(),
			internals: useImageCropperInternals(),
		} ),
		{ wrapper }
	);
}

type Rendered = ReturnType< typeof renderCropper >;

// The canvas calls `setImage` when its `img` loads. jsdom fires no load
// event, so the tests load the image the same way, through the controller.
function loadImage( view: Rendered, image = SQUARE ) {
	act( () => view.result.current.internals.controller.setImage( image ) );
}

describe( 'useImageCropper', () => {
	beforeEach( () => {
		// Each test that is not about the notice starts with it logged, so
		// the console stays quiet.
		logged[ DEPRECATION_MESSAGE ] = true;
	} );

	it( 'logs one deprecation notice naming @wordpress/image-editor', () => {
		delete logged[ DEPRECATION_MESSAGE ];
		expect( DEPRECATION_MESSAGE ).toContain( '@wordpress/image-editor' );

		renderCropper();
		renderCropper();

		expect( console ).toHaveWarned();
	} );

	it( 'reports a full-frame crop once a square image loads', () => {
		const view = renderCropper();
		expect( view.result.current.cropper.cropperState.mediaSize ).toBeNull();
		expect(
			view.result.current.cropper.cropperState.croppedAreaPixels
		).toBeNull();

		loadImage( view );

		const { cropperState, isDirty } = view.result.current.cropper;
		expect( cropperState.mediaSize ).toEqual( {
			width: 800,
			height: 800,
			naturalWidth: 800,
			naturalHeight: 800,
		} );
		expect( cropperState.croppedArea ).toEqual( {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
		} );
		expect( cropperState.croppedAreaPixels ).toEqual( {
			x: 0,
			y: 0,
			width: 800,
			height: 800,
		} );
		expect( cropperState.aspectRatio ).toBe( 1 );
		expect( isDirty ).toBe( false );
	} );

	it( 'reshapes the crop to a new aspect ratio and becomes dirty', () => {
		const view = renderCropper();
		loadImage( view );

		act( () =>
			view.result.current.cropper.setCropperState( {
				aspectRatio: 16 / 9,
			} )
		);

		const { croppedArea, aspectRatio } =
			view.result.current.cropper.cropperState;
		expect( aspectRatio ).toBe( 16 / 9 );
		expect( croppedArea.width ).toBeCloseTo( 100 );
		expect( croppedArea.height ).toBeCloseTo( 56.25 );
		expect( view.result.current.cropper.isDirty ).toBe( true );
	} );

	it( 'normalizes a negative rotation and keeps the crop ratio on screen through a quarter turn', () => {
		const view = renderCropper();
		loadImage( view, WIDE );
		act( () =>
			view.result.current.cropper.setCropperState( { aspectRatio: 2 } )
		);
		expect(
			view.result.current.cropper.cropperState.croppedAreaPixels
		).toEqual( { x: 0, y: 0, width: 400, height: 200 } );

		act( () =>
			view.result.current.cropper.setCropperState( { rotation: -90 } )
		);

		// The rotated image is 200 wide and 400 tall, and the 2:1 crop
		// keeps its shape on screen, so it spans the width and half the
		// height, as it did with the old library.
		const { rotation, croppedAreaPixels } =
			view.result.current.cropper.cropperState;
		expect( rotation ).toBe( 270 );
		expect( croppedAreaPixels?.width ).toBeCloseTo( 200 );
		expect( croppedAreaPixels?.height ).toBeCloseTo( 100 );
		expect( croppedAreaPixels?.y ).toBeCloseTo( 150 );
	} );

	it( 'rotates by 90 through the hook exactly as the editor snaps a quarter turn', () => {
		const { result: viaHook } = renderCropper();
		const { result: viaSnap } = renderCropper();
		for ( const result of [ viaHook, viaSnap ] ) {
			act( () => result.current.internals.controller.setImage( WIDE ) );
			act( () => result.current.cropper.setCropperState( { zoom: 2 } ) );
			act( () =>
				result.current.cropper.setCropperState( {
					crop: { x: 0.1, y: 0.05 },
				} )
			);
		}

		act( () =>
			viaHook.current.cropper.setCropperState( { rotation: 90 } )
		);
		act( () => viaSnap.current.internals.controller.snapRotate90( 1 ) );

		expect( viaHook.current.internals.controller.state ).toEqual(
			viaSnap.current.internals.controller.state
		);
		expect(
			areImageEditorStatesEqual(
				viaHook.current.internals.controller.state,
				viaSnap.current.internals.controller.state
			)
		).toBe( true );
		expect( viaHook.current.cropper.cropperState.rotation ).toBe( 90 );
	} );

	it( 'keeps the crop and pan when flipping', () => {
		const view = renderCropper();
		loadImage( view );
		const before = view.result.current.cropper.cropperState;

		act( () =>
			view.result.current.cropper.setCropperState( {
				flip: { horizontal: true, vertical: false },
			} )
		);

		const after = view.result.current.cropper.cropperState;
		expect( after.flip ).toEqual( { horizontal: true, vertical: false } );
		expect( after.croppedArea ).toEqual( before.croppedArea );
		expect( after.crop.x ).toBeCloseTo( before.crop.x, 6 );
		expect( after.crop.y ).toBeCloseTo( before.crop.y, 6 );
	} );

	it( 'caps zoom at 5 by default', () => {
		const view = renderCropper();
		loadImage( view );

		act( () => view.result.current.cropper.setCropperState( { zoom: 8 } ) );

		expect( view.result.current.cropper.cropperState.zoom ).toBe( 5 );
	} );

	it( 'passes the previous state to a function updater', () => {
		const view = renderCropper();
		loadImage( view );
		let seen: number | undefined;

		act( () =>
			view.result.current.cropper.setCropperState( ( previous ) => {
				seen = previous.aspectRatio;
				return { zoom: previous.zoom + 1 };
			} )
		);

		expect( seen ).toBe( 1 );
		expect( view.result.current.cropper.cropperState.zoom ).toBe( 2 );
	} );

	it( 'applies a reset state, compares dirtiness against it, and returns to it', () => {
		const view = renderCropper();
		loadImage( view );

		act( () =>
			view.result.current.cropper.setResetState( {
				rotation: 90,
				zoom: 1.5,
			} )
		);

		let { cropperState } = view.result.current.cropper;
		expect( cropperState.rotation ).toBe( 90 );
		expect( cropperState.zoom ).toBe( 1.5 );
		expect( view.result.current.cropper.isDirty ).toBe( false );
		expect( view.result.current.cropper.resetState ).toMatchObject( {
			rotation: 90,
			zoom: 1.5,
			aspectRatio: 1,
		} );

		act( () => view.result.current.cropper.setCropperState( { zoom: 2 } ) );
		expect( view.result.current.cropper.isDirty ).toBe( true );

		act( () => view.result.current.cropper.reset() );
		( { cropperState } = view.result.current.cropper );
		expect( cropperState.zoom ).toBe( 1.5 );
		expect( cropperState.rotation ).toBe( 90 );
		expect( view.result.current.cropper.isDirty ).toBe( false );
	} );

	it( 'honours a reset state set before the image loads, and keeps the image on reset', () => {
		const view = renderCropper();
		act( () =>
			view.result.current.cropper.setResetState( {
				aspectRatio: 16 / 9,
			} )
		);

		loadImage( view );

		expect( view.result.current.cropper.isDirty ).toBe( false );
		expect(
			view.result.current.cropper.cropperState.croppedArea.height
		).toBeCloseTo( 56.25 );

		act( () => view.result.current.cropper.reset() );
		expect( view.result.current.cropper.cropperState.mediaSize ).toEqual( {
			width: 800,
			height: 800,
			naturalWidth: 800,
			naturalHeight: 800,
		} );
		expect( view.result.current.cropper.isDirty ).toBe( false );
	} );

	it( 'clears the reset state and returns to the defaults with null', () => {
		const view = renderCropper();
		loadImage( view );
		act( () =>
			view.result.current.cropper.setResetState( { rotation: 180 } )
		);

		act( () => view.result.current.cropper.setResetState( null ) );

		const { cropperState, resetState, isDirty } =
			view.result.current.cropper;
		expect( resetState ).toBeNull();
		expect( cropperState.rotation ).toBe( 0 );
		expect( cropperState.zoom ).toBe( 1 );
		expect( cropperState.aspectRatio ).toBe( 1 );
		expect( isDirty ).toBe( false );
	} );

	it( 'keeps the same setter functions across state changes', () => {
		// A consumer's mount effect that depends on `setResetState`, as the
		// README shows, must run once rather than after every change.
		const view = renderCropper();
		const before = view.result.current.cropper;

		loadImage( view );
		act( () => before.setResetState( { rotation: 90 } ) );
		act( () => before.setCropperState( { zoom: 2 } ) );

		const after = view.result.current.cropper;
		expect( after.cropperState.zoom ).toBe( 2 );
		expect( after.setCropperState ).toBe( before.setCropperState );
		expect( after.setResetState ).toBe( before.setResetState );
		expect( after.reset ).toBe( before.reset );
		expect( after.getCroppedImage ).toBe( before.getCroppedImage );
	} );

	it( 'returns null from getCroppedImage before an image loads', async () => {
		const view = renderCropper();

		await expect(
			view.result.current.cropper.getCroppedImage( 'ignored.png' )
		).resolves.toBeNull();
	} );
} );
