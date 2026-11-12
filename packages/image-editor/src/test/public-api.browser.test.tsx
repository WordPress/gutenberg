import { describe, expect, it } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useEffect, useState } from '@wordpress/element';
// Only what the package exports, as a consumer would import it.
import {
	ImageEditorCanvas,
	createImageEditorState,
	getOutputSize,
	mapEditToOriginal,
	useImageEditor,
	type ImageEditorController,
	type ImageEditorState,
} from '..';
// Browser Mode needs the package's real styles for layout.
import '../style.scss';

const IMAGE = {
	src: 'photo.png',
	naturalWidth: 1200,
	naturalHeight: 600,
};

function ConsumerEditor( {
	onController,
	initialState = createImageEditorState(),
	freeformCrop = true,
}: {
	onController: ( controller: ImageEditorController ) => void;
	initialState?: ImageEditorState;
	freeformCrop?: boolean;
} ) {
	const [ state, setState ] = useState( initialState );
	const controller = useImageEditor( { state, onChange: setState } );
	const { setImage } = controller;
	useEffect( () => setImage( IMAGE ), [ setImage ] );
	useEffect( () => onController( controller ), [ controller, onController ] );
	return (
		<div style={ { width: 648, height: 448 } }>
			<ImageEditorCanvas
				src={ IMAGE.src }
				controller={ controller }
				freeformCrop={ freeformCrop }
			/>
		</div>
	);
}

// Crop size in source pixels, from the normalized crop of an unrotated,
// unzoomed image.
function cropSize( controller: ImageEditorController ) {
	const { width, height } = controller.state.cropRect;
	return {
		width: Math.round( width * IMAGE.naturalWidth ),
		height: Math.round( height * IMAGE.naturalHeight ),
	};
}

describe( 'the public API', () => {
	it( 'only takes a controller `useImageEditor` made', () => {
		// The canvas also calls methods that are not on the public type, so
		// an object that merely matches it must not type-check here.
		const byHand = {
			state: createImageEditorState(),
			isDirty: false,
			minZoom: 1,
			maxZoom: 10,
			maxRotationOffset: 45,
			setImage: () => {},
			reset: () => {},
			setPan: () => {},
			setZoom: () => {},
			setRotation: () => {},
			snapRotate90: () => {},
			setFlip: () => {},
			toggleFlip: () => {},
			setCropRect: () => {},
			setAspectRatio: () => {},
		};

		const rejected = (
			<ImageEditorCanvas
				src="x.png"
				// @ts-expect-error -- a hand-built controller is not ours.
				controller={ byHand }
			/>
		);

		expect( rejected ).toBeTruthy();
	} );

	it( 'crops and maps the edit to the original from the package exports alone', async () => {
		let controller!: ImageEditorController;
		const onController = ( next: ImageEditorController ) => {
			controller = next;
		};
		await render( <ConsumerEditor onController={ onController } /> );
		// The handles render once the canvas has measured itself.
		await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );
		expect( cropSize( controller ) ).toEqual( {
			width: 1200,
			height: 600,
		} );

		expect( {
			minZoom: controller.minZoom,
			maxZoom: controller.maxZoom,
			maxRotationOffset: controller.maxRotationOffset,
		} ).toEqual( { minZoom: 1, maxZoom: 10, maxRotationOffset: 45 } );

		act( () => controller.setAspectRatio( 1 ) );
		expect( controller.state.aspectRatio ).toBe( 1 );
		expect( cropSize( controller ) ).toEqual( { width: 600, height: 600 } );

		act( () => controller.snapRotate90( 1 ) );
		act( () => controller.toggleFlip( 'horizontal' ) );
		expect(
			mapEditToOriginal( controller.state ).map( ( { type } ) => type )
		).toEqual( [ 'flip', 'rotate', 'crop' ] );

		act( () => controller.reset() );
		expect( controller.state.aspectRatio ).toBeUndefined();
		expect( mapEditToOriginal( controller.state ) ).toEqual( [] );
	} );

	it( 'starts with the crop locked to a ratio', async () => {
		let controller!: ImageEditorController;
		const onController = ( next: ImageEditorController ) => {
			controller = next;
		};
		await render(
			<ConsumerEditor
				onController={ onController }
				initialState={ createImageEditorState( { aspectRatio: 1 } ) }
				freeformCrop={ false }
			/>
		);

		await waitFor( () =>
			expect( cropSize( controller ) ).toEqual( {
				width: 600,
				height: 600,
			} )
		);
		// Fitting the crop to the locked ratio is not an edit.
		expect( controller.isDirty ).toBe( false );
		// The square is 600 px of the 1200x600 image, in both directions.
		expect( getOutputSize( controller.state ) ).toEqual( {
			width: 600,
			height: 600,
		} );
	} );

	it( 'keeps a locked ratio for a state that starts with its image, and for the crop setter', async () => {
		let controller!: ImageEditorController;
		const onController = ( next: ImageEditorController ) => {
			controller = next;
		};
		await render(
			<ConsumerEditor
				onController={ onController }
				initialState={ createImageEditorState( {
					image: IMAGE,
					aspectRatio: 1,
				} ) }
			/>
		);

		await waitFor( () =>
			expect( cropSize( controller ) ).toEqual( {
				width: 600,
				height: 600,
			} )
		);
		expect( controller.isDirty ).toBe( false );

		act( () =>
			controller.setCropRect( { x: 0, y: 0, width: 1, height: 1 } )
		);
		expect( controller.state.aspectRatio ).toBe( 1 );
		expect( cropSize( controller ) ).toEqual( { width: 600, height: 600 } );
	} );

	it( 'starts with the crop locked to a ratio in freeform mode too', async () => {
		let controller!: ImageEditorController;
		const onController = ( next: ImageEditorController ) => {
			controller = next;
		};
		await render(
			<ConsumerEditor
				onController={ onController }
				initialState={ createImageEditorState( { aspectRatio: 1 } ) }
			/>
		);

		await waitFor( () =>
			expect( cropSize( controller ) ).toEqual( {
				width: 600,
				height: 600,
			} )
		);
		expect( controller.isDirty ).toBe( false );
	} );
} );
