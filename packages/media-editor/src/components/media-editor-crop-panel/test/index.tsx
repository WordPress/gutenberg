/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MediaEditorCropPanel from '..';
import type { MediaEditorCropPanelProps } from '..';
import { MediaEditorStateProvider } from '../../../state';
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
		</MediaEditorStateProvider>
	);

	return props;
}

describe( 'MediaEditorCropPanel', () => {
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

	it( 'omits the image controls by default', () => {
		setupCropPanel();

		expect( screen.queryByText( 'Rotate' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Flip' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Zoom' ) ).not.toBeInTheDocument();
	} );

	it( 'renders rotate, flip and zoom controls when showTransformControls is set', () => {
		setupCropPanel( { showTransformControls: true } );

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

	it( 'renders the image controls above the aspect-ratio selector', () => {
		setupCropPanel( { showTransformControls: true } );

		const rotate = screen.getByText( 'Rotate' );
		const aspectRatio = screen.getByLabelText( 'Aspect ratio' );

		expect( rotate.compareDocumentPosition( aspectRatio ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );
} );
