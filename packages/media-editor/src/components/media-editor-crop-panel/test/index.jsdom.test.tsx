import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaEditorCropPanel from '..';
import type { MediaEditorCropPanelProps } from '..';
import { MediaEditorStateProvider } from '../../../state';

globalThis.wpVitest.mockMatchMedia();

function setupCropPanel(
	overrides: Partial< MediaEditorCropPanelProps > = {}
) {
	const props: MediaEditorCropPanelProps = {
		aspectRatioValue: '1',
		onAspectRatioChange: vi.fn(),
		aspectRatioOptions: [
			{ label: 'Free', value: 0 },
			{ label: 'Original', value: -1 },
			{ label: 'Square', value: 1 },
		],
		...overrides,
	};

	render(
		<MediaEditorStateProvider>
			<MediaEditorCropPanel { ...props } />
		</MediaEditorStateProvider>
	);

	return props;
}

describe( 'MediaEditorCropPanel', () => {
	it( 'passes selected aspect ratio changes to the caller', async () => {
		const user = userEvent.setup();
		const controls = setupCropPanel( {
			aspectRatioValue: '1',
		} );

		await user.click(
			screen.getByRole( 'combobox', { name: 'Aspect ratio' } )
		);
		await user.click(
			await screen.findByRole( 'option', { name: 'Free' } )
		);

		expect( controls.onAspectRatioChange ).toHaveBeenCalledExactlyOnceWith(
			'0'
		);
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
