import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useState } from '@wordpress/element';
import MediaEditorImageControls from '..';
import type { MediaEditorImageControlsProps } from '..';
import { MediaEditorStateProvider, useMediaEditor } from '../../../state';
import { MAX_ZOOM } from '../../../image-editor/core/constants';

function setup( props: MediaEditorImageControlsProps = {}, zoom?: number ) {
	render(
		<MediaEditorStateProvider>
			<MediaEditorImageControls { ...props } />
			<CurrentState zoom={ zoom } />
		</MediaEditorStateProvider>
	);
}

function CurrentState( { zoom }: { zoom?: number } ) {
	const {
		cropper: { state, setZoom },
		cropOptions,
	} = useMediaEditor();
	// Start the cases that need it zoomed in. `setZoom` is a session edit,
	// so these cases begin with one undo entry; none of them checks history.
	useEffect( () => {
		if ( zoom !== undefined ) {
			setZoom( zoom );
		}
	}, [ setZoom, zoom ] );

	return (
		<>
			<output data-testid="current-aspect-ratio">
				{ cropOptions.aspectRatioValue }
			</output>
			<output data-testid="current-zoom">{ state.zoom }</output>
		</>
	);
}

describe( 'MediaEditorImageControls', () => {
	it( 'renders a flat row of rotate, flip and zoom buttons by default', () => {
		setup();

		expect(
			screen.getByRole( 'button', {
				name: 'Rotate 90° counter-clockwise',
			} )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Flip horizontal' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Zoom in' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Zoom out' } )
		).toBeInTheDocument();

		// No visible group labels in the flat (footer) layout.
		expect( screen.queryByText( 'Rotate' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Flip' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Zoom' ) ).not.toBeInTheDocument();
	} );

	it( 'renders labelled rotate, flip and zoom groups when withLabels is set', () => {
		setup( { withLabels: true } );

		expect( screen.getByText( 'Rotate' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Flip' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Zoom' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Rotate 90° clockwise' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Zoom in' } )
		).toBeInTheDocument();
	} );

	it( 'zoom in multiplies the zoom and zoom out divides it', () => {
		setup( {}, 2 );

		fireEvent.click( screen.getByRole( 'button', { name: 'Zoom in' } ) );
		const zoomedIn = Number(
			screen.getByTestId( 'current-zoom' ).textContent
		);
		expect( zoomedIn ).toBeGreaterThan( 2 );

		fireEvent.click( screen.getByRole( 'button', { name: 'Zoom out' } ) );
		expect(
			Number( screen.getByTestId( 'current-zoom' ).textContent )
		).toBeLessThan( zoomedIn );
	} );

	it( 'honors a custom zoomFactor', () => {
		setup( { zoomFactor: 2 }, 2 );

		fireEvent.click( screen.getByRole( 'button', { name: 'Zoom in' } ) );

		// A factor of 2 from zoom 2 lands at 4 (within [minZoom, MAX_ZOOM]).
		expect(
			Number( screen.getByTestId( 'current-zoom' ).textContent )
		).toBe( 4 );
	} );

	it( 'disables Zoom in at the maximum zoom', () => {
		setup( {}, MAX_ZOOM );
		// Buttons use `accessibleWhenDisabled`, so the disabled state is
		// expressed via aria-disabled, not the `disabled` attribute.
		expect(
			screen.getByRole( 'button', { name: 'Zoom in' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'disables Zoom out at the minimum zoom', () => {
		setup();
		expect(
			screen.getByRole( 'button', { name: 'Zoom out' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
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

	it( 'ignores an aspect ratio chosen from a menu left open when disabled', async () => {
		function Harness() {
			const [ locked, setLocked ] = useState( false );
			return (
				<MediaEditorStateProvider>
					<MediaEditorImageControls
						showAspectRatioControl
						disabled={ locked }
					/>
					<button onClick={ () => setLocked( true ) }>lock</button>
					<CurrentState />
				</MediaEditorStateProvider>
			);
		}
		render( <Harness /> );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Aspect ratio' } )
		);
		const before = screen.getByTestId( 'current-aspect-ratio' ).textContent;

		// The popover stays mounted when the toggle becomes disabled, so
		// the items have to refuse the change themselves.
		fireEvent.click( screen.getByRole( 'button', { name: 'lock' } ) );
		fireEvent.click(
			screen.getByRole( 'menuitemradio', { name: 'Square (1:1)' } )
		);

		await waitFor( () =>
			expect(
				screen.getByTestId( 'current-aspect-ratio' )
			).toHaveTextContent( before ?? '' )
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
