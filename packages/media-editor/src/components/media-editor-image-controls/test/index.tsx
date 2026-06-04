/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MediaEditorImageControls from '..';
import type { MediaEditorImageControlsProps } from '..';
import { MediaEditorStateProvider, useMediaEditor } from '../../../state';

function setup( props: MediaEditorImageControlsProps = {} ) {
	render(
		<MediaEditorStateProvider>
			<MediaEditorImageControls { ...props } />
			<CurrentAspectRatioValue />
		</MediaEditorStateProvider>
	);
}

function CurrentAspectRatioValue() {
	const { cropOptions } = useMediaEditor();

	return (
		<output data-testid="current-aspect-ratio">
			{ cropOptions.aspectRatioValue }
		</output>
	);
}

describe( 'MediaEditorImageControls', () => {
	it( 'renders a flat row of rotate and flip buttons by default', () => {
		setup();

		expect(
			screen.getByRole( 'button', {
				name: 'Rotate 90° counter-clockwise',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Rotate 90° clockwise' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Flip horizontal' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Flip vertical' } )
		).toBeInTheDocument();

		// No visible group labels in the flat (footer) layout.
		expect( screen.queryByText( 'Rotate' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Flip' ) ).not.toBeInTheDocument();
	} );

	it( 'renders labelled rotate and flip groups when withLabels is set', () => {
		setup( { withLabels: true } );

		expect( screen.getByText( 'Rotate' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Flip' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Rotate 90° clockwise' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Flip vertical' } )
		).toBeInTheDocument();
	} );

	it( 'renders an aspect ratio dropdown in the flat toolbar when enabled', async () => {
		setup( {
			showAspectRatioControl: true,
		} );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Aspect ratio' } )
		);
		fireEvent.click(
			screen.getByRole( 'menuitemradio', { name: 'Square (1:1)' } )
		);

		await waitFor( () =>
			expect(
				screen.getByTestId( 'current-aspect-ratio' )
			).toHaveTextContent( '1' )
		);
	} );

	it( 'omits the aspect ratio dropdown from the labelled panel layout', () => {
		setup( {
			withLabels: true,
			showAspectRatioControl: true,
		} );

		expect(
			screen.queryByRole( 'button', { name: 'Aspect ratio' } )
		).not.toBeInTheDocument();
	} );
} );
