import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import FilePreview from '../file-preview';

describe( 'FilePreview', () => {
	it( 'shows the filename of the media', () => {
		render(
			<FilePreview
				url="https://example.com/wp-content/uploads/2026/11/wave.mp3"
				mediaType="audio"
			/>
		);

		expect( screen.getByText( 'wave.mp3' ) ).toBeVisible();
	} );

	it( 'shows a filename with non-ASCII characters as written, not percent-encoded', () => {
		render(
			<FilePreview
				url="https://example.com/wp-content/uploads/2026/11/%E7%94%9F%E6%88%90%E6%B3%A2%E3%81%AE%E9%9F%B31.mp3"
				mediaType="audio"
			/>
		);

		expect( screen.getByText( '生成波の音1.mp3' ) ).toBeVisible();
		expect( screen.queryByText( /%E7/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders only the icon when the URL has no filename', () => {
		const { container } = render(
			<FilePreview
				url="https://example.com/wp-content/uploads/"
				mediaType="audio"
			/>
		);

		// The icon has no text, so nothing should render a name.
		expect(
			within( container ).queryByText( /\S/ )
		).not.toBeInTheDocument();
	} );
} );
