import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import type { Field } from '@wordpress/dataviews';
import MediaPreview from '..';
import { MediaEditorProvider } from '../../media-editor-provider';
import type { Media } from '../../media-editor-provider';

const FIELDS = [
	{
		id: 'filename',
		getValue: ( { item }: { item: Media } ) =>
			item.source_url?.split( '/' ).pop() ?? '',
	},
	{
		id: 'filesize',
		getValue: () => '2.4 MB',
	},
] as Field< Media >[];

const ZIP: Media = {
	id: 1,
	source_url: 'https://example.com/wp-content/uploads/archive.zip',
	mime_type: 'application/zip',
	title: { raw: 'My archive', rendered: 'My archive' },
};

const PDF: Media = {
	id: 2,
	source_url: 'https://example.com/file.pdf',
	mime_type: 'application/pdf',
	title: 'My PDF',
};

function setup( media: Media, fields: Field< Media >[] = FIELDS ) {
	return render(
		<MediaEditorProvider value={ media } settings={ { fields } }>
			<MediaPreview />
		</MediaEditorProvider>
	);
}

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

// jsdom doesn't implement `navigator.pdfViewerEnabled`.
function setPdfViewerEnabled( enabled: boolean ) {
	vi.stubGlobal( 'navigator', {
		...window.navigator,
		pdfViewerEnabled: enabled,
	} );
}

// jsdom doesn't implement the Clipboard API.
function setClipboardWriteText(
	writeText: ( text: string ) => Promise< void >
) {
	Object.defineProperty( window.navigator, 'clipboard', {
		value: { writeText },
		configurable: true,
	} );
}

describe( 'MediaPreview', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
		vi.mocked( speak ).mockClear();
		// @ts-expect-error The property is only defined by the tests.
		delete window.navigator.clipboard;
	} );

	it( 'embeds a PDF when the browser has a PDF viewer', () => {
		setPdfViewerEnabled( true );
		setup( PDF );

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
		setup( PDF );

		const embed = screen.getByLabelText(
			'Embed of the selected PDF file.'
		);
		expect( embed ).toContainElement( screen.getByText( 'file.pdf' ) );
	} );

	it( 'shows the file info when the browser has no PDF viewer', () => {
		setPdfViewerEnabled( false );
		setup( PDF );

		expect(
			screen.queryByLabelText( 'Embed of the selected PDF file.' )
		).not.toBeInTheDocument();
		expect( screen.getByText( 'file.pdf' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Download' } )
		).toBeInTheDocument();
	} );

	it( 'shows the filename, type and size for a file without a preview', () => {
		setup( ZIP );

		expect( screen.getByText( 'archive.zip' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'application/zip · 2.4 MB' )
		).toBeInTheDocument();
	} );

	it( 'links Download to the file', () => {
		setup( ZIP );

		const link = screen.getByRole( 'link', { name: 'Download' } );
		expect( link ).toHaveAttribute( 'href', ZIP.source_url );
		expect( link ).toHaveAttribute( 'download' );
	} );

	it( 'opens Download in a new tab', () => {
		setup( ZIP );

		expect(
			screen.getByRole( 'link', { name: 'Download' } )
		).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'copies the URL and announces it', async () => {
		const writeText = vi.fn( () => Promise.resolve() );
		setClipboardWriteText( writeText );
		setup( ZIP );

		fireEvent.click( screen.getByRole( 'button', { name: 'Copy URL' } ) );

		await waitFor( () =>
			expect( speak ).toHaveBeenCalledWith( 'Copied URL to clipboard.' )
		);
		expect( writeText ).toHaveBeenCalledWith( ZIP.source_url );
		expect(
			screen.getByRole( 'button', { name: 'Copy URL' } )
		).toBeInTheDocument();
	} );

	it( 'announces when the URL could not be copied', async () => {
		setClipboardWriteText( () => Promise.reject( new Error( 'Denied' ) ) );
		setup( ZIP );

		fireEvent.click( screen.getByRole( 'button', { name: 'Copy URL' } ) );

		await waitFor( () =>
			expect( speak ).toHaveBeenCalledWith(
				"Couldn't copy URL to clipboard."
			)
		);
	} );

	it( 'falls back to the title when there is no filename field', () => {
		setup( ZIP, [] );

		expect( screen.getByText( 'My archive' ) ).toBeInTheDocument();
		expect( screen.getByText( 'application/zip' ) ).toBeInTheDocument();
	} );

	it( 'shows the empty state when there is no source URL', () => {
		setup( { id: 1 } );

		expect(
			screen.getByRole( 'heading', { name: 'No media file available.' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Download' } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the error state with actions when a video fails to load', () => {
		setup( {
			id: 1,
			source_url: 'https://example.com/wp-content/uploads/clip.mp4',
			mime_type: 'video/mp4',
			title: 'Clip',
		} );

		// The video's fallback content is its title, which labels it.
		fireEvent.error( screen.getByText( 'Clip' ) );

		expect(
			screen.getByRole( 'heading', {
				name: 'Failed to load media file.',
			} )
		).toBeInTheDocument();
		expect( screen.getByText( 'clip.mp4' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Download' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Copy URL' } )
		).toBeInTheDocument();
	} );
} );
