import { describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useEffect } from '@wordpress/element';
// Only what the package exports, as a consumer would import it.
import {
	Cropper,
	buildModifiers,
	useCropperController,
	type CropperController,
} from '..';
// Browser Mode needs the package's real styles for layout.
import '../style.scss';

const IMAGE = {
	src: 'photo.png',
	naturalWidth: 1200,
	naturalHeight: 600,
};

function ConsumerCropper( {
	onController,
}: {
	onController: ( controller: CropperController ) => void;
} ) {
	const controller = useCropperController();
	const { setImage } = controller;
	useEffect( () => setImage( IMAGE ), [ setImage ] );
	useEffect( () => onController( controller ), [ controller, onController ] );
	return (
		<div style={ { width: 648, height: 448 } }>
			<Cropper src={ IMAGE.src } controller={ controller } freeformCrop />
		</div>
	);
}

// Crop size in source pixels, from the normalized crop of an unrotated,
// unzoomed image.
function cropSize( controller: CropperController ) {
	const { width, height } = controller.state.cropRect;
	return {
		width: Math.round( width * IMAGE.naturalWidth ),
		height: Math.round( height * IMAGE.naturalHeight ),
	};
}

describe( 'the public API', () => {
	it( 'crops and builds the server instructions from the package exports alone', async () => {
		let controller!: CropperController;
		const onController = ( next: CropperController ) => {
			controller = next;
		};
		await render( <ConsumerCropper onController={ onController } /> );
		// The handles render once the cropper has measured itself.
		await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );
		expect( cropSize( controller ) ).toEqual( {
			width: 1200,
			height: 600,
		} );

		act( () => controller.setAspectRatio( 1 ) );
		expect( controller.state.aspectRatio ).toBe( 1 );
		expect( cropSize( controller ) ).toEqual( { width: 600, height: 600 } );

		act( () => controller.snapRotate90( 1 ) );
		act( () => controller.toggleFlip( 'horizontal' ) );
		expect(
			buildModifiers( controller ).map( ( { type } ) => type )
		).toEqual( [ 'flip', 'rotate', 'crop' ] );

		act( () => controller.reset() );
		expect( controller.state.aspectRatio ).toBeUndefined();
		expect( buildModifiers( controller ) ).toEqual( [] );
	} );
} );
