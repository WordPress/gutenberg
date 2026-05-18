/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import MediaEditorCropPanel from '..';
import type { MediaEditorCropPanelProps } from '..';
import { CropperProvider } from '../../../image-editor';

function setupCropPanel(
	overrides: Partial< MediaEditorCropPanelProps > = {}
) {
	const props: MediaEditorCropPanelProps = {
		aspectRatioValue: '1',
		onAspectRatioChange: jest.fn(),
		freeformCrop: false,
		onFreeformChange: jest.fn(),
		aspectRatioOptions: [
			{ label: 'Free', value: 0 },
			{ label: 'Original', value: -1 },
			{ label: 'Square', value: 1 },
		],
		...overrides,
	};

	render(
		<CropperProvider>
			<MediaEditorCropPanel { ...props } />
		</CropperProvider>
	);

	return props;
}

function expectElementBefore( first: HTMLElement, second: HTMLElement ) {
	expect( first.compareDocumentPosition( second ) ).toBe(
		Node.DOCUMENT_POSITION_FOLLOWING
	);
}

describe( 'MediaEditorCropPanel', () => {
	it( 'renders crop shape controls before zoom controls', () => {
		setupCropPanel();

		const aspectRatio = screen.getByLabelText( 'Aspect ratio' );
		const resizeCropArea = screen.getByLabelText( 'Resize crop area' );
		const zoom = screen.getByRole( 'slider', { name: 'Zoom' } );

		expect(
			screen.getByText( 'Show handles to adjust the crop box.' )
		).toBeInTheDocument();
		expectElementBefore( aspectRatio, resizeCropArea );
		expectElementBefore( resizeCropArea, zoom );
	} );

	it( 'passes selected aspect ratio changes to the caller', () => {
		const controls = setupCropPanel( {
			aspectRatioValue: '1',
			freeformCrop: false,
		} );

		fireEvent.change( screen.getByLabelText( 'Aspect ratio' ), {
			target: { value: '0' },
		} );

		expect( controls.onAspectRatioChange ).toHaveBeenCalled();
		expect(
			( controls.onAspectRatioChange as jest.Mock ).mock.calls[ 0 ][ 0 ]
		).toBe( '0' );
		expect( controls.onFreeformChange ).not.toHaveBeenCalled();
	} );

	it( 'passes resize-handle changes to the caller', () => {
		const controls = setupCropPanel( {
			aspectRatioValue: '0',
			freeformCrop: true,
		} );

		fireEvent.click( screen.getByLabelText( 'Resize crop area' ) );

		expect( controls.onFreeformChange ).toHaveBeenCalledWith( false );
	} );
} );
