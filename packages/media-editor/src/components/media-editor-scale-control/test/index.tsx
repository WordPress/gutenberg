import { fireEvent, render, screen } from '@testing-library/react';
import MediaEditorScaleControl from '..';
import { MediaEditorStateProvider, useMediaEditor } from '../../../state';
import type { CropperState } from '../../../image-editor';

const IMAGE = {
	src: 'test.jpg',
	naturalWidth: 640,
	naturalHeight: 480,
};

/**
 * Exposes undo so a test can check how many history entries an edit made.
 */
function UndoProbe() {
	const { undo, hasUndo } = useMediaEditor();
	return (
		<button type="button" onClick={ undo } disabled={ ! hasUndo }>
			undo
		</button>
	);
}

function setupScaleControl( initialCropperState?: Partial< CropperState > ) {
	render(
		<MediaEditorStateProvider
			initialCropperState={ { image: IMAGE, ...initialCropperState } }
		>
			<MediaEditorScaleControl />
			<UndoProbe />
		</MediaEditorStateProvider>
	);

	return {
		width: screen.getByLabelText( 'Width' ) as HTMLInputElement,
		height: screen.getByLabelText( 'Height' ) as HTMLInputElement,
		undo: screen.getByRole( 'button', { name: 'undo' } ),
		reset: screen.getByRole( 'button', { name: 'Reset to original' } ),
	};
}

const OVER_ORIGINAL_WARNING =
	'640 × 480 is the original size. Anything larger scales back down.';

describe( 'MediaEditorScaleControl', () => {
	it( 'renders nothing until an image is loaded', () => {
		render(
			<MediaEditorStateProvider>
				<MediaEditorScaleControl />
			</MediaEditorStateProvider>
		);

		expect( screen.queryByLabelText( 'Width' ) ).not.toBeInTheDocument();
	} );

	it( "shows the image's natural size when nothing has been scaled", () => {
		const { width, height } = setupScaleControl();

		expect( width ).toHaveValue( 640 );
		expect( height ).toHaveValue( 480 );
	} );

	it( 'fills in the height when a width is typed', () => {
		const { width, height } = setupScaleControl();

		fireEvent.change( width, { target: { value: '320' } } );

		expect( height ).toHaveValue( 240 );
	} );

	it( 'fills in the width when a height is typed', () => {
		const { width, height } = setupScaleControl();

		fireEvent.change( height, { target: { value: '240' } } );

		expect( width ).toHaveValue( 320 );
	} );

	it( 'leaves the image alone until the field is left', () => {
		const { width, undo } = setupScaleControl();

		fireEvent.change( width, { target: { value: '320' } } );

		// Nothing committed yet, so there is nothing to undo.
		expect( undo ).toBeDisabled();
	} );

	it( 'scales the image when the field is left', () => {
		const { width, undo } = setupScaleControl();

		fireEvent.change( width, { target: { value: '320' } } );
		fireEvent.blur( width );

		expect( undo ).toBeEnabled();
	} );

	it( 'scales the image when Enter is pressed', () => {
		const { width, undo } = setupScaleControl();

		fireEvent.change( width, { target: { value: '320' } } );
		fireEvent.keyDown( width, { key: 'Enter' } );

		expect( undo ).toBeEnabled();
	} );

	it( 'records one undo entry for one edit', () => {
		const { width, height, undo } = setupScaleControl();

		fireEvent.change( width, { target: { value: '320' } } );
		fireEvent.blur( width );

		expect( width ).toHaveValue( 320 );

		fireEvent.click( undo );

		expect( width ).toHaveValue( 640 );
		expect( height ).toHaveValue( 480 );
		expect( undo ).toBeDisabled();
	} );

	it( 'caps a width larger than the image at its natural size', () => {
		const { width, height } = setupScaleControl();

		fireEvent.change( width, { target: { value: '1280' } } );
		fireEvent.blur( width );

		expect( width ).toHaveValue( 640 );
		expect( height ).toHaveValue( 480 );
	} );

	it( 'restores the previous size when the field is left empty', () => {
		const { width, height } = setupScaleControl();

		fireEvent.change( width, { target: { value: '' } } );
		fireEvent.blur( width );

		expect( width ).toHaveValue( 640 );
		expect( height ).toHaveValue( 480 );
	} );

	it( 'says the scale applies to the whole image', () => {
		setupScaleControl();

		expect(
			screen.getByText(
				'Scaling applies to the whole image, before any crop.'
			)
		).toBeInTheDocument();
	} );

	it( 'does not show a saved size when the whole image is kept', () => {
		setupScaleControl();

		expect( screen.queryByText( /Saved size/ ) ).not.toBeInTheDocument();
	} );

	it( 'shows the size the file will be saved at when a crop is in play', () => {
		setupScaleControl( {
			cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		} );

		expect(
			screen.getByText( 'Saved size: 320 × 240 pixels.' )
		).toBeInTheDocument();
	} );

	it( 'reports the saved size against the scaled image, not the original', () => {
		const { width } = setupScaleControl( {
			cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
		} );

		fireEvent.change( width, { target: { value: '320' } } );
		fireEvent.blur( width );

		expect(
			screen.getByText( 'Saved size: 160 × 120 pixels.' )
		).toBeInTheDocument();
	} );
	describe( 'when a value exceeds the original', () => {
		it( 'warns while the value is still being typed', () => {
			const { width } = setupScaleControl();

			fireEvent.change( width, { target: { value: '1280' } } );

			expect(
				screen.getByText( OVER_ORIGINAL_WARNING )
			).toBeInTheDocument();
		} );

		it( 'stays quiet for a value within the original', () => {
			const { width } = setupScaleControl();

			fireEvent.change( width, { target: { value: '320' } } );

			expect(
				screen.queryByText( OVER_ORIGINAL_WARNING )
			).not.toBeInTheDocument();
		} );

		it( 'warns when the linked field is the one that overflows', () => {
			const { height } = setupScaleControl();

			// 481 is over the 480 height on its own.
			fireEvent.change( height, { target: { value: '481' } } );

			expect(
				screen.getByText( OVER_ORIGINAL_WARNING )
			).toBeInTheDocument();
		} );

		it( 'describes both fields with the warning for screen readers', () => {
			const { width, height } = setupScaleControl();

			fireEvent.change( width, { target: { value: '1280' } } );

			expect( width ).toHaveAccessibleDescription(
				OVER_ORIGINAL_WARNING
			);
			expect( height ).toHaveAccessibleDescription(
				OVER_ORIGINAL_WARNING
			);
		} );

		it( 'clears the warning once the value is capped', () => {
			const { width } = setupScaleControl();

			fireEvent.change( width, { target: { value: '1280' } } );
			fireEvent.blur( width );

			expect(
				screen.queryByText( OVER_ORIGINAL_WARNING )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'reset to original', () => {
		// The button stays focusable while unavailable (`accessibleWhenDisabled`)
		// so it reports its state through `aria-disabled` rather than by
		// dropping out of the tab order.
		it( 'is unavailable when the image has not been scaled', () => {
			const { reset } = setupScaleControl();

			expect( reset ).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'becomes available once the image is scaled', () => {
			const { width, reset } = setupScaleControl();

			fireEvent.change( width, { target: { value: '320' } } );
			fireEvent.blur( width );

			expect( reset ).not.toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'puts the image back to its original size', () => {
			const { width, height, reset } = setupScaleControl();

			fireEvent.change( width, { target: { value: '320' } } );
			fireEvent.blur( width );

			fireEvent.click( reset );

			expect( width ).toHaveValue( 640 );
			expect( height ).toHaveValue( 480 );
			expect( reset ).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'discards a value that was typed but not committed', () => {
			const { width, height, reset } = setupScaleControl();

			fireEvent.change( width, { target: { value: '320' } } );
			fireEvent.blur( width );
			fireEvent.change( width, { target: { value: '160' } } );

			fireEvent.click( reset );

			expect( width ).toHaveValue( 640 );
			expect( height ).toHaveValue( 480 );
		} );
	} );

	describe( 'increment arrows', () => {
		it( 'offers native spin controls on both fields', () => {
			const { width, height } = setupScaleControl();

			// The `custom` variant would render Increment/Decrement buttons
			// that steal focus from the field and commit on every click.
			expect(
				screen.queryByRole( 'button', { name: 'Increment' } )
			).not.toBeInTheDocument();
			expect( width ).toHaveAttribute( 'type', 'number' );
			expect( height ).toHaveAttribute( 'type', 'number' );
		} );
	} );
} );
