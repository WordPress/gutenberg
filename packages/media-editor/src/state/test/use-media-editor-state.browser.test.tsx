import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { act, screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useEffect } from '@wordpress/element';
import { Cropper } from '../../image-editor';
import {
	useMediaEditorState,
	type MediaEditorSession,
} from '../use-media-editor-state';
// Browser Mode needs the package's real styles for layout and transitions.
import '../../image-editor/style.scss';

// Shown below 1:1 in the fixture, so pixel snapping stays off until a crop
// magnifies the image past one screen pixel per source pixel.
const IMAGE = {
	src: 'large.png',
	naturalWidth: 999,
	naturalHeight: 999,
};

function CropperWithHistory( {
	onController,
}: {
	onController: ( controller: MediaEditorSession ) => void;
} ) {
	const controller = useMediaEditorState();
	const { setSourceImage } = controller;
	useEffect( () => setSourceImage( IMAGE ), [ setSourceImage ] );
	useEffect( () => onController( controller ), [ controller, onController ] );
	return (
		<div style={ { width: 648, height: 448 } }>
			<Cropper
				src={ IMAGE.src }
				controller={ controller.cropper }
				freeformCrop
				onGestureStart={ controller.beginGesture }
				onGestureEnd={ controller.endGesture }
			/>
		</div>
	);
}

describe( 'useMediaEditorState with a Cropper', () => {
	it( 'keeps redo steps after redoing a handle crop that turns on pixel snapping', async () => {
		let controller!: MediaEditorSession;
		const onController = ( next: MediaEditorSession ) => {
			controller = next;
		};
		await render( <CropperWithHistory onController={ onController } /> );
		const handle = await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );

		// Shrink the crop to 30% in steps of 10% of a 999px image, so its
		// edges fall between source pixels, then wait for it to settle.
		handle.focus();
		await userEvent.keyboard(
			'{Shift>}' +
				'{ArrowLeft}'.repeat( 7 ) +
				'{ArrowUp}'.repeat( 7 ) +
				'{/Shift}'
		);
		await waitFor( () =>
			expect( controller.cropper.state.zoom ).toBeGreaterThan( 1 )
		);

		act( () =>
			controller.cropper.setFlip( { horizontal: true, vertical: false } )
		);

		for ( let i = 0; i < 10 && controller.hasUndo; i++ ) {
			act( () => controller.undo() );
		}
		act( () => controller.redo() );

		expect( controller.hasRedo ).toBe( true );
	} );
} );
