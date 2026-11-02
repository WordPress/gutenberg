import { describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useEffect } from '@wordpress/element';
// Only what the package exports, as a consumer would import it.
import {
	Cropper,
	buildModifiers,
	getSourceRegion,
	useCropSession,
	type CropSession,
} from '..';
// Browser Mode needs the package's real styles for layout.
import '../style.scss';

const IMAGE = {
	src: 'photo.png',
	naturalWidth: 1200,
	naturalHeight: 600,
};
const IMAGE_SIZE = { width: 1200, height: 600 };

function CropperWithHistory( {
	onSession,
}: {
	onSession: ( session: CropSession ) => void;
} ) {
	const session = useCropSession();
	const { setSourceImage } = session;
	useEffect( () => setSourceImage( IMAGE ), [ setSourceImage ] );
	useEffect( () => onSession( session ), [ session, onSession ] );
	return (
		<div style={ { width: 648, height: 448 } }>
			<Cropper
				src={ IMAGE.src }
				controller={ session.cropper }
				freeformCrop
				onGestureStart={ session.beginGesture }
				onGestureEnd={ session.endGesture }
			/>
		</div>
	);
}

function cropSize( session: CropSession ) {
	const { width, height } = getSourceRegion(
		session.cropper.state,
		IMAGE_SIZE
	);
	return { width: Math.round( width ), height: Math.round( height ) };
}

describe( 'the public API', () => {
	it( 'crops, undoes and builds the server instructions from the package exports alone', async () => {
		let session!: CropSession;
		const onSession = ( next: CropSession ) => {
			session = next;
		};
		await render( <CropperWithHistory onSession={ onSession } /> );
		// The handles render once the cropper has measured itself.
		await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );
		expect( cropSize( session ) ).toEqual( { width: 1200, height: 600 } );

		act( () => session.setAspectRatioValue( '1' ) );
		expect( cropSize( session ) ).toEqual( { width: 600, height: 600 } );

		act( () => session.cropper.snapRotate90( 1 ) );
		act( () => session.cropper.toggleFlip( 'horizontal' ) );
		expect(
			buildModifiers( session.cropper ).map( ( { type } ) => type )
		).toEqual( [ 'flip', 'rotate', 'crop' ] );

		act( () => session.undo() );
		expect( session.cropper.state.flip.horizontal ).toBe( false );
		act( () => session.undo() );
		expect( session.cropper.state.rotation ).toBe( 0 );
		act( () => session.undo() );
		expect( session.cropOptions.aspectRatioValue ).toBe( '0' );
		expect( cropSize( session ) ).toEqual( { width: 1200, height: 600 } );
		expect( session.hasUndo ).toBe( false );

		act( () => session.redo() );
		expect( session.cropOptions.aspectRatioValue ).toBe( '1' );
		expect( cropSize( session ) ).toEqual( { width: 600, height: 600 } );
	} );
} );
