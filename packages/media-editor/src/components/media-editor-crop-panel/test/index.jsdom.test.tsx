import { fireEvent, render, screen } from '@testing-library/react';
import MediaEditorCropPanel from '..';
import type { MediaEditorCropPanelProps } from '..';
import { MediaEditorStateProvider } from '../../../state';
import type { CropperState } from '../../../image-editor';

function setupCropPanel(
	overrides: Partial< MediaEditorCropPanelProps > = {},
	initialCropperState?: Partial< CropperState >
) {
	const props: MediaEditorCropPanelProps = {
		cropShape: 'rectangle',
		onCropShapeChange: jest.fn(),
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

	it( 'passes selected crop shape changes to the caller', () => {
		const controls = setupCropPanel();

		fireEvent.click( screen.getByRole( 'radio', { name: 'Circle' } ) );

		expect( controls.onCropShapeChange ).toHaveBeenCalledWith( 'circle' );
	} );

	it( 'omits the aspect-ratio selector for circle crops', () => {
		setupCropPanel( { cropShape: 'circle' } );

		expect(
			screen.queryByLabelText( 'Aspect ratio' )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Circle' } ) ).toBeChecked();
		expect(
			screen.getByText(
				'Circle crops are saved as PNG files to preserve transparency, but may result in larger file sizes.'
			)
		).toBeInTheDocument();
	} );

	it( 'does not show PNG format help for rectangle crops', () => {
		setupCropPanel();

		expect(
			screen.queryByText(
				'Circle crops are saved as PNG files to preserve transparency, but may result in larger file sizes.'
			)
		).not.toBeInTheDocument();
	} );

	it( 'renders rotate, flip and zoom controls', () => {
		setupCropPanel();

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
		setupCropPanel();

		const rotate = screen.getByText( 'Rotate' );
		const aspectRatio = screen.getByLabelText( 'Aspect ratio' );

		expect( rotate.compareDocumentPosition( aspectRatio ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );
} );
