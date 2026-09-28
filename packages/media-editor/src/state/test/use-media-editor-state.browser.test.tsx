import { describe, expect, it } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useEffect } from '@wordpress/element';
import { Cropper } from '../../image-editor';
import {
	useMediaEditorState,
	type MediaEditorController,
} from '../use-media-editor-state';
// Browser Mode needs the package's real styles for layout and transitions.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../../image-editor/style.scss';

// Shown below 1:1 in the fixture, so pixel snapping stays off until a crop
// magnifies the image past one screen pixel per source pixel.
const IMAGE = {
	src: 'large.png',
	naturalWidth: 1000,
	naturalHeight: 1000,
};

function CropperWithHistory( {
	onController,
}: {
	onController: ( controller: MediaEditorController ) => void;
} ) {
	const controller = useMediaEditorState( { cropper: { image: IMAGE } } );
	useEffect( () => onController( controller ), [ controller, onController ] );
	return (
		<div style={ { width: 648, height: 448 } }>
			<Cropper
				src={ IMAGE.src }
				controller={ controller }
				freeformCrop
				onGestureStart={ controller.beginGesture }
				onGestureEnd={ controller.endGesture }
			/>
		</div>
	);
}

describe( 'useMediaEditorState with a Cropper', () => {
	it( 'keeps redo steps after redoing a handle crop that turns on pixel snapping', async () => {
		let controller!: MediaEditorController;
		const onController = ( next: MediaEditorController ) => {
			controller = next;
		};
		await render( <CropperWithHistory onController={ onController } /> );
		const handle = await screen.findByRole( 'button', {
			name: 'Resize from bottom-right corner',
		} );

		// Drag the corner in by an odd pixel count so the crop edges fall
		// between source pixels, then release so the crop settles.
		const { left, top } = handle.getBoundingClientRect();
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: left,
			clientY: top,
			pointerId: 1,
		} );
		fireEvent.pointerMove( handle, {
			clientX: left - 297,
			clientY: top - 297,
			pointerId: 1,
		} );
		await waitFor( () =>
			expect( controller.state.cropRect.width ).toBeLessThan( 0.5 )
		);
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		act( () =>
			controller.setFlip( { horizontal: true, vertical: false } )
		);

		for ( let i = 0; i < 10 && controller.hasUndo; i++ ) {
			act( () => controller.undo() );
		}
		act( () => controller.redo() );

		expect( controller.hasRedo ).toBe( true );
	} );
} );
