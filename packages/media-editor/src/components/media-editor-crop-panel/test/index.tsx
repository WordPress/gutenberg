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

	it( 'turns freeform crop on when Free is selected while handles are off', () => {
		const controls = setupCropPanel( {
			aspectRatioValue: '1',
			freeformCrop: false,
		} );

		fireEvent.change( screen.getByLabelText( 'Aspect ratio' ), {
			target: { value: '0' },
		} );

		expect( controls.onAspectRatioChange ).toHaveBeenCalledWith( '0' );
		expect( controls.onFreeformChange ).toHaveBeenCalledWith( true );
	} );

	it( 'does not change freeform crop when a fixed ratio is selected', () => {
		const controls = setupCropPanel( {
			aspectRatioValue: '0',
			freeformCrop: false,
		} );

		fireEvent.change( screen.getByLabelText( 'Aspect ratio' ), {
			target: { value: '1' },
		} );

		expect( controls.onAspectRatioChange ).toHaveBeenCalledWith( '1' );
		expect( controls.onFreeformChange ).not.toHaveBeenCalled();
	} );

	it( 'does not call onFreeformChange when Free is selected and handles are already on', () => {
		const controls = setupCropPanel( {
			aspectRatioValue: '1',
			freeformCrop: true,
		} );

		fireEvent.change( screen.getByLabelText( 'Aspect ratio' ), {
			target: { value: '0' },
		} );

		expect( controls.onAspectRatioChange ).toHaveBeenCalledWith( '0' );
		expect( controls.onFreeformChange ).not.toHaveBeenCalled();
	} );

	it( 'does not call onFreeformChange when a fixed ratio is selected and handles are on', () => {
		const controls = setupCropPanel( {
			aspectRatioValue: '0',
			freeformCrop: true,
		} );

		fireEvent.change( screen.getByLabelText( 'Aspect ratio' ), {
			target: { value: '1' },
		} );

		expect( controls.onAspectRatioChange ).toHaveBeenCalledWith( '1' );
		expect( controls.onFreeformChange ).not.toHaveBeenCalled();
	} );
} );
