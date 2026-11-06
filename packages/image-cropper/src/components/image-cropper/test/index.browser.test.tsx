import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { logged } from '@wordpress/deprecated';
import { useEffect } from '@wordpress/element';
// Only what the package exports, as a consumer would import it.
import { ImageCropper, ImageCropperProvider, useImageCropper } from '../../..';
import { DEPRECATION_MESSAGE } from '../../../provider';
import type { ImageCropperContextValue } from '../../../types';
// Browser Mode needs the package's real styles for layout.
import '../../../style.scss';

function paintedImage(
	width: number,
	height: number,
	color = 'rgb(51, 153, 255)'
) {
	const canvas = document.createElement( 'canvas' );
	canvas.width = width;
	canvas.height = height;
	// A fresh canvas has a 2D context.
	const context = canvas.getContext( '2d' )!;
	context.fillStyle = color;
	context.fillRect( 0, 0, width, height );
	return canvas.toDataURL( 'image/png' );
}

// The colour at the centre of an exported image.
async function centrePixel( url: string ) {
	const bitmap = await createImageBitmap(
		await ( await fetch( url ) ).blob()
	);
	const canvas = document.createElement( 'canvas' );
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	// A fresh canvas has a 2D context.
	const context = canvas.getContext( '2d' )!;
	context.drawImage( bitmap, 0, 0 );
	const [ r, g, b ] = context.getImageData(
		bitmap.width / 2,
		bitmap.height / 2,
		1,
		1
	).data;
	bitmap.close();
	return { r, g, b };
}

function Probe( {
	onValue,
}: {
	onValue: ( value: ImageCropperContextValue ) => void;
} ) {
	const value = useImageCropper();
	useEffect( () => onValue( value ), [ value, onValue ] );
	return null;
}

describe( 'ImageCropper', () => {
	beforeEach( () => {
		logged[ DEPRECATION_MESSAGE ] = true;
	} );

	it( 'renders the editor canvas edge to edge, without handles or the old library classes', async () => {
		let cropper!: ImageCropperContextValue;
		const onValue = ( value: ImageCropperContextValue ) => {
			cropper = value;
		};
		await render(
			<ImageCropperProvider>
				<div
					style={ { position: 'relative', width: 648, height: 448 } }
				>
					<ImageCropper src={ paintedImage( 1200, 600 ) } />
				</div>
				<Probe onValue={ onValue } />
			</ImageCropperProvider>
		);

		await waitFor( () =>
			expect( cropper.cropperState.mediaSize ).toEqual( {
				width: 1200,
				height: 600,
				naturalWidth: 1200,
				naturalHeight: 600,
			} )
		);

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		// The class names are the contract under test, and no role names them.
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			canvas.closest( '.image-cropper__container' )
		).toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			document.querySelector( '[class*="reactEasyCrop"]' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Resize from/ } )
		).not.toBeInTheDocument();

		expect( getComputedStyle( canvas ).top ).toBe( '0px' );
		expect( getComputedStyle( canvas ).left ).toBe( '0px' );
	} );

	it( 'exports the crop as an object URL once the image has loaded', async () => {
		let cropper!: ImageCropperContextValue;
		const onValue = ( value: ImageCropperContextValue ) => {
			cropper = value;
		};
		await render(
			<ImageCropperProvider>
				<div
					style={ { position: 'relative', width: 648, height: 448 } }
				>
					<ImageCropper src={ paintedImage( 1200, 600 ) } />
				</div>
				<Probe onValue={ onValue } />
			</ImageCropperProvider>
		);
		// The crop is fitted to the canvas, so the values carry float noise.
		await waitFor( () => {
			const pixels = cropper.cropperState.croppedAreaPixels;
			expect( pixels?.x ).toBeCloseTo( 300, 2 );
			expect( pixels?.y ).toBeCloseTo( 0, 2 );
			expect( pixels?.width ).toBeCloseTo( 600, 2 );
			expect( pixels?.height ).toBeCloseTo( 600, 2 );
		} );

		const url = await cropper.getCroppedImage();
		expect( url ).toMatch( /^blob:/ );
		const blue = await centrePixel( url! );
		expect( blue.b ).toBeGreaterThan( 200 );
		expect( blue.r ).toBeLessThan( 100 );

		// A processed copy of the image, passed in, is what gets cut.
		const fromCopy = await cropper.getCroppedImage(
			paintedImage( 1200, 600, 'rgb(220, 20, 20)' )
		);
		const red = await centrePixel( fromCopy! );
		expect( red.r ).toBeGreaterThan( 200 );
		expect( red.b ).toBeLessThan( 100 );
	} );
} );
