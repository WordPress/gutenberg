/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MediaEditorCropPanel from '..';
import type { MediaEditorCropPanelProps } from '..';
import { MediaEditorStateProvider, useMediaEditor } from '../../../state';
import type { CropperState } from '../../../image-editor';

function setupCropPanel(
	overrides: Partial< MediaEditorCropPanelProps > = {},
	initialCropperState?: Partial< CropperState >
) {
	const props: MediaEditorCropPanelProps = {
		aspectRatioValue: '1',
		onAspectRatioChange: jest.fn(),
		aspectRatioOptions: [
			{ label: 'Free', value: 0 },
			{ label: 'Original', value: -1 },
			{ label: 'Square', value: 1 },
		],
		...overrides,
	};

	render(
		<MediaEditorStateProvider initialCropperState={ initialCropperState }>
			<MediaEditorCropPanel { ...props } />
			<CurrentZoomValue />
		</MediaEditorStateProvider>
	);

	return props;
}

function CurrentZoomValue() {
	const { state } = useMediaEditor();

	return <output data-testid="current-zoom">{ state.zoom }</output>;
}

describe( 'MediaEditorCropPanel', () => {
	it( 'renders crop shape controls before zoom controls', () => {
		setupCropPanel();

		const aspectRatio = screen.getByLabelText( 'Aspect ratio' );
		const zoom = screen.getByRole( 'slider', { name: 'Zoom (%)' } );

		expect( aspectRatio.compareDocumentPosition( zoom ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );

	it( 'passes selected aspect ratio changes to the caller', () => {
		const controls = setupCropPanel( {
			aspectRatioValue: '1',
		} );

		fireEvent.change( screen.getByLabelText( 'Aspect ratio' ), {
			target: { value: '0' },
		} );

		expect( controls.onAspectRatioChange ).toHaveBeenCalled();
		expect(
			( controls.onAspectRatioChange as jest.Mock ).mock.calls[ 0 ][ 0 ]
		).toBe( '0' );
	} );

	it( 'displays zoom as a percentage without changing cropper state', () => {
		setupCropPanel( {}, { zoom: 3.749999999999999 } );

		const zoomInput = screen.getByRole( 'spinbutton', {
			name: 'Zoom (%)',
		} );

		expect( zoomInput ).toHaveValue( 375 );
		expect( screen.getByTestId( 'current-zoom' ) ).toHaveTextContent(
			'3.749999999999999'
		);
	} );

	it( 'converts percentage input back to the cropper zoom multiplier', () => {
		const controls = setupCropPanel( {
			onPlacementControlInteraction: jest.fn(),
		} );

		fireEvent.change(
			screen.getByRole( 'spinbutton', { name: 'Zoom (%)' } ),
			{
				target: { value: '250' },
			}
		);

		expect( screen.getByTestId( 'current-zoom' ) ).toHaveTextContent(
			'2.5'
		);
		expect( controls.onPlacementControlInteraction ).toHaveBeenCalled();
	} );

	it( 'omits transform controls by default', () => {
		setupCropPanel();

		expect( screen.queryByText( 'Rotate' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Flip' ) ).not.toBeInTheDocument();
	} );

	it( 'renders rotate and flip controls when showTransformControls is set', () => {
		setupCropPanel( { showTransformControls: true } );

		expect( screen.getByText( 'Rotate' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Flip' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Rotate 90° clockwise' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Flip horizontal' } )
		).toBeInTheDocument();
	} );
} );
