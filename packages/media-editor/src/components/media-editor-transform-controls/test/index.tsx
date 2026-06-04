/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MediaEditorTransformControls from '..';
import type { MediaEditorTransformControlsProps } from '..';
import { MediaEditorStateProvider } from '../../../state';

function setup( props: MediaEditorTransformControlsProps = {} ) {
	render(
		<MediaEditorStateProvider>
			<MediaEditorTransformControls { ...props } />
		</MediaEditorStateProvider>
	);
}

describe( 'MediaEditorTransformControls', () => {
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

	it( 'renders an aspect ratio dropdown in the flat toolbar when aspect ratio props are provided', () => {
		const onAspectRatioChange = jest.fn();
		setup( {
			aspectRatioValue: '1',
			onAspectRatioChange,
			aspectRatioOptions: [
				{ label: 'Free', value: 0 },
				{ label: 'Original', value: -1 },
				{ label: 'Square', value: 1 },
			],
		} );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Aspect ratio' } )
		);
		fireEvent.click(
			screen.getByRole( 'menuitemradio', { name: 'Free' } )
		);

		expect( onAspectRatioChange ).toHaveBeenCalledWith( '0' );
	} );

	it( 'omits the aspect ratio dropdown from the labelled panel layout', () => {
		setup( {
			withLabels: true,
			aspectRatioValue: '1',
			onAspectRatioChange: jest.fn(),
			aspectRatioOptions: [
				{ label: 'Free', value: 0 },
				{ label: 'Original', value: -1 },
				{ label: 'Square', value: 1 },
			],
		} );

		expect(
			screen.queryByRole( 'button', { name: 'Aspect ratio' } )
		).not.toBeInTheDocument();
	} );
} );
