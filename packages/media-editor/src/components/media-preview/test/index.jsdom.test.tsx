import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MediaPreview from '../index';
import type { Media } from '../../media-editor-provider';

let mockMedia: Media | undefined;

vi.mock(
	import( '../../media-editor-provider' ),
	() =>
		( {
			useMediaEditorContext: () => ( {
				media: mockMedia,
				fields: [],
			} ),
		} ) as unknown as typeof import( '../../media-editor-provider' )
);

// jsdom doesn't implement `navigator.pdfViewerEnabled`.
function setPdfViewerEnabled( enabled: boolean ) {
	vi.stubGlobal( 'navigator', {
		...window.navigator,
		pdfViewerEnabled: enabled,
	} );
}

describe( 'MediaPreview', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
		mockMedia = undefined;
	} );

	it( 'embeds a PDF when the browser has a PDF viewer', () => {
		setPdfViewerEnabled( true );
		mockMedia = {
			source_url: 'https://example.com/file.pdf',
			mime_type: 'application/pdf',
			title: 'My PDF',
		};

		render( <MediaPreview /> );

		const embed = screen.getByLabelText(
			'Embed of the selected PDF file.'
		);
		expect( embed.tagName ).toBe( 'OBJECT' );
		expect( embed ).toHaveAttribute(
			'data',
			'https://example.com/file.pdf#view=Fit&zoom=page-fit'
		);
		expect( embed ).toHaveAttribute( 'type', 'application/pdf' );
	} );

	it( 'includes the file info as fallback content inside the PDF embed', () => {
		setPdfViewerEnabled( true );
		mockMedia = {
			source_url: 'https://example.com/file.pdf',
			mime_type: 'application/pdf',
			title: 'My PDF',
		};

		render( <MediaPreview /> );

		const embed = screen.getByLabelText(
			'Embed of the selected PDF file.'
		);
		expect( embed ).toContainElement( screen.getByText( 'My PDF' ) );
	} );

	it( 'shows the file info when the browser has no PDF viewer', () => {
		setPdfViewerEnabled( false );
		mockMedia = {
			source_url: 'https://example.com/file.pdf',
			mime_type: 'application/pdf',
			title: 'My PDF',
		};

		render( <MediaPreview /> );

		expect(
			screen.queryByLabelText( 'Embed of the selected PDF file.' )
		).not.toBeInTheDocument();
		expect( screen.getByText( 'My PDF' ) ).toBeInTheDocument();
		expect( screen.getByText( 'View file' ) ).toBeInTheDocument();
	} );
} );
