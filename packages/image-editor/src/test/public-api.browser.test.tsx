import { describe, expect, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useEffect, useState } from '@wordpress/element';
// Only what the package exports, as a consumer would import it.
import {
	ImageEditorCanvas,
	applyImageEdit,
	createImageEditorState,
	exportImage,
	getOutputSize,
	getImageEdit,
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

// A real image the renderer can draw, since `photo.png` never loads.
function paintedImage( naturalWidth: number, naturalHeight: number ) {
	const canvas = document.createElement( 'canvas' );
	canvas.width = naturalWidth;
	canvas.height = naturalHeight;
	// A fresh canvas has a 2D context.
	const context = canvas.getContext( '2d' )!;
	context.fillStyle = 'rgb(51, 153, 255)';
	context.fillRect( 0, 0, naturalWidth, naturalHeight );
	return {
		src: canvas.toDataURL( 'image/png' ),
		naturalWidth,
		naturalHeight,
	};
}

async function decodedSize( blob: Blob ) {
	const bitmap = await createImageBitmap( blob );
	const size = { width: bitmap.width, height: bitmap.height };
	bitmap.close();
	return size;
}

function ConsumerEditor( {
	onController,
	initialState = createImageEditorState(),
	freeformCrop = true,
	className,
	image = IMAGE,
}: {
	onController: ( controller: ImageEditorController ) => void;
	initialState?: ImageEditorState;
	freeformCrop?: boolean;
	className?: string;
	image?: typeof IMAGE;
} ) {
	const [ state, setState ] = useState( initialState );
	const controller = useImageEditor( { state, onChange: setState } );
	const { setImage } = controller;
	useEffect( () => setImage( image ), [ setImage, image ] );
	useEffect( () => onController( controller ), [ controller, onController ] );
	return (
		<div style={ { width: 648, height: 448 } }>
			<ImageEditorCanvas
				src={ image.src }
				controller={ controller }
				freeformCrop={ freeformCrop }
				className={ className }
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

	it( 'crops and describes the edit from the package exports alone', async () => {
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
		const edit = getImageEdit( controller.state );
		expect( edit?.flip ).toEqual( { horizontal: true, vertical: false } );
		expect( edit?.rotation ).toBeGreaterThan( 0 );
		expect( edit?.crop ).toBeDefined();

		act( () => controller.reset() );
		expect( controller.state.aspectRatio ).toBeUndefined();
		expect( getImageEdit( controller.state ) ).toEqual( {} );
	} );

	it( 'shows an edit applied from code', async () => {
		// The left half of the turned image: 300 by 1200 pixels.
		const edit = {
			rotation: 90,
			crop: { x: 0, y: 0, width: 0.5, height: 1 },
		};
		const applied = applyImageEdit(
			createImageEditorState( { image: IMAGE } ),
			edit
		);
		if ( ! ( 'state' in applied ) ) {
			throw new Error( `Rejected as ${ applied.rejected }` );
		}
		let controller!: ImageEditorController;
		const onController = ( next: ImageEditorController ) => {
			controller = next;
		};
		await render(
			<ConsumerEditor
				onController={ onController }
				initialState={ applied.state }
			/>
		);
		const handle = await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );

		expect( getImageEdit( controller.state ) ).toEqual( {
			rotation: 90,
			crop: {
				x: expect.closeTo( 0 ),
				y: expect.closeTo( 0 ),
				width: expect.closeTo( 0.5 ),
				height: expect.closeTo( 1 ),
			},
		} );
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		const tooltip = await screen.findByTestId(
			'image-editor-dimensions-tooltip'
		);
		expect( tooltip ).toHaveTextContent( 'W: 300px H: 1200px' );
		fireEvent.pointerUp( handle, { pointerId: 1 } );
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

	it( 'lets a consumer theme the canvas with CSS custom properties', async () => {
		await render(
			<>
				<style>{ `
					.my-cropper {
						--wp-image-editor-accent-color: rgb(90, 10, 110);
						--wp-image-editor-surface-color: rgb(240, 230, 220);
						--wp-image-editor-foreground-color: rgb(10, 20, 30);
						--wp-image-editor-dimming-color: rgba(255, 0, 0, 0.6);
						--wp-image-editor-canvas-inset: 30px;
					}
				` }</style>
				<ConsumerEditor
					onController={ () => {} }
					className="my-cropper"
				/>
			</>
		);
		const handle = await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );
		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		const dimming = screen.getByTestId( 'image-editor-dimming' );

		expect( getComputedStyle( canvas ).top ).toBe( '30px' );
		expect( getComputedStyle( handle ).backgroundColor ).toBe(
			'rgb(240, 230, 220)'
		);
		expect( getComputedStyle( handle ).borderTopColor ).toBe(
			'rgb(90, 10, 110)'
		);
		expect( getComputedStyle( dimming ).boxShadow ).toContain(
			'rgba(255, 0, 0, 0.6)'
		);
		dimming.style.transition = 'none';
		fireEvent.pointerDown( canvas, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		expect( getComputedStyle( dimming ).boxShadow ).toContain(
			'color(srgb 1 0 0 / 0.4'
		);
		fireEvent.pointerUp( canvas, { pointerId: 1 } );
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		const tooltip = await screen.findByTestId(
			'image-editor-dimensions-tooltip'
		);
		expect( getComputedStyle( tooltip ).backgroundColor ).toBe(
			'rgb(240, 230, 220)'
		);
		expect( getComputedStyle( tooltip ).color ).toBe( 'rgb(10, 20, 30)' );
		fireEvent.pointerUp( handle, { pointerId: 1 } );
	} );

	it( 'refuses to export before an image has loaded', async () => {
		await expect( exportImage( createImageEditorState() ) ).rejects.toThrow(
			/image/i
		);
	} );

	it( 'rejects with an Error when the image fails to load', async () => {
		const state = createImageEditorState( {
			image: {
				src: 'missing.png',
				naturalWidth: 1200,
				naturalHeight: 600,
			},
		} );
		const rejection = exportImage( state );
		await expect( rejection ).rejects.toBeInstanceOf( Error );
		await expect( rejection ).rejects.toThrow( 'missing.png' );
	} );

	it( 'exports the framed region at the size getOutputSize reports, in the type asked for', async () => {
		const state = createImageEditorState( {
			image: paintedImage( 1200, 600 ),
			aspectRatio: 1,
		} );
		expect( getOutputSize( state ) ).toEqual( { width: 600, height: 600 } );

		const png = await exportImage( state );
		expect( png.type ).toBe( 'image/png' );
		expect( await decodedSize( png ) ).toEqual( {
			width: 600,
			height: 600,
		} );

		const jpeg = await exportImage( state, {
			type: 'image/jpeg',
			quality: 0.8,
		} );
		expect( jpeg.type ).toBe( 'image/jpeg' );
		expect( await decodedSize( jpeg ) ).toEqual( {
			width: 600,
			height: 600,
		} );
	} );

	it( 'exports the framed region at source size when zoomed, not upscaled', async () => {
		let controller!: ImageEditorController;
		const onController = ( next: ImageEditorController ) => {
			controller = next;
		};
		const image = paintedImage( 1200, 600 );
		await render(
			<ConsumerEditor onController={ onController } image={ image } />
		);
		await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );

		act( () => controller.setZoom( 2 ) );

		// At 2x the full-frame crop frames the middle quarter of the image.
		const outputSize = getOutputSize( controller.state )!;
		expect( outputSize.width ).toBeCloseTo( 600 );
		expect( outputSize.height ).toBeCloseTo( 300 );
		expect(
			await decodedSize( await exportImage( controller.state ) )
		).toEqual( { width: 600, height: 300 } );
	} );

	it( 'swaps the exported width and height after a quarter turn', async () => {
		let controller!: ImageEditorController;
		const onController = ( next: ImageEditorController ) => {
			controller = next;
		};
		const image = paintedImage( 1200, 600 );
		await render(
			<ConsumerEditor onController={ onController } image={ image } />
		);
		await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );
		expect(
			await decodedSize( await exportImage( controller.state ) )
		).toEqual( { width: 1200, height: 600 } );

		act( () => controller.snapRotate90( 1 ) );
		expect(
			await decodedSize( await exportImage( controller.state ) )
		).toEqual( { width: 600, height: 1200 } );
	} );

	it( 'shows the canvas with standalone style defaults', async () => {
		await render( <ConsumerEditor onController={ () => {} } /> );
		const handle = await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );
		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		const dimming = screen.getByTestId( 'image-editor-dimming' );

		expect( getComputedStyle( canvas ).top ).toBe( '24px' );
		expect( getComputedStyle( handle ).backgroundColor ).toBe(
			'rgb(255, 255, 255)'
		);
		expect( getComputedStyle( dimming ).boxShadow ).toMatch(
			/color\(srgb 0\.878\d* 0\.878\d* 0\.878\d* \/ 0\.6\)|rgba\(224, 224, 224, 0\.6\)/
		);
	} );
} );
