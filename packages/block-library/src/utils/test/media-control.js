/**
 * Internal dependencies
 */
import { MediaControlPreview } from '../media-control';

/**
 * WordPress dependencies
 */
import { render, screen } from '@testing-library/react';

describe( 'MediaControlPreview', () => {
	it( 'displays the filename when provided', () => {
		render(
			<MediaControlPreview
				url="https://example.com/image.jpg"
				filename="image.jpg"
			/>
		);
		expect( screen.getByText( 'image.jpg' ) ).toBeVisible();
	} );

	it( 'displays the label when filename is not provided', () => {
		render(
			<MediaControlPreview
				url="https://example.com/image.jpg"
				label="Fallback"
			/>
		);
		expect( screen.getByText( 'Fallback' ) ).toBeVisible();
	} );
} );
