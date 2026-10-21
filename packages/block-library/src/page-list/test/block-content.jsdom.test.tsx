import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlockContent } from '../edit';

const blockProps = { className: 'wp-block-page-list' };

const pages = [
	{ id: 2, parent: 0, title: { rendered: 'About' } },
	{ id: 3, parent: 0, title: { rendered: '' } },
];

function renderBlockContent(
	props: Partial< Parameters< typeof BlockContent >[ 0 ] >
) {
	return render(
		<BlockContent
			blockProps={ blockProps }
			innerBlocksProps={ blockProps }
			hasResolvedPages
			blockList={ [] }
			parentPageID={ 0 }
			{ ...props }
		/>
	);
}

// `Notice` also speaks its message through the a11y live region, which
// outlives the render; only look at the markup the block rendered.
const inCanvas = { ignore: '[aria-live]' };

describe( 'Page List BlockContent', () => {
	test( 'shows a spinner while the pages are loading', () => {
		renderBlockContent( { hasResolvedPages: false, pages: null } );
		expect(
			screen.getByRole( 'presentation', { hidden: true } )
		).toHaveClass( 'wp-block-page-list__loading-indicator' );
	} );

	test( 'warns that pages could not be retrieved when the request failed', () => {
		renderBlockContent( { pages: null } );
		expect(
			screen.getByText( 'Warning notice', inCanvas )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Page List: Cannot retrieve Pages.', inCanvas )
		).toBeInTheDocument();
	} );

	test( 'shows an informational empty state when the site has no pages', () => {
		renderBlockContent( { pages: [] } );
		expect(
			screen.getByText( 'Information notice', inCanvas )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Page List: No pages found.', inCanvas )
		).toBeInTheDocument();
		expect(
			screen.queryByText( 'Page List: Cannot retrieve Pages.', inCanvas )
		).not.toBeInTheDocument();
	} );

	test( 'shows the empty state when a parent is selected but the site has no pages', () => {
		renderBlockContent( { pages: [], parentPageID: 2 } );
		expect(
			screen.getByText( 'Information notice', inCanvas )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Page List: No pages found.', inCanvas )
		).toBeInTheDocument();
	} );

	test( 'names the selected parent page when it has no child pages', () => {
		renderBlockContent( { pages, parentPageID: 2 } );
		expect(
			screen.getByText( 'Warning notice', inCanvas )
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Page List: "About" page has no children.',
				inCanvas
			)
		).toBeInTheDocument();
	} );

	test( 'falls back to "(no title)" for a parent page without a title', () => {
		renderBlockContent( { pages, parentPageID: 3 } );
		expect(
			screen.getByText(
				'Page List: "(no title)" page has no children.',
				inCanvas
			)
		).toBeInTheDocument();
	} );

	test( 'says so when the selected parent page is not among the pages', () => {
		renderBlockContent( { pages, parentPageID: 99 } );
		expect(
			screen.getByText( 'Warning notice', inCanvas )
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'Page List: The selected parent page could not be found.',
				inCanvas
			)
		).toBeInTheDocument();
	} );

	test( 'renders the list when there are pages to show', () => {
		renderBlockContent( { pages, blockList: [ { clientId: 'a' } ] } );
		expect( screen.getByRole( 'list' ) ).toHaveClass(
			'wp-block-page-list'
		);
		expect(
			screen.queryByText( /Page List:/, inCanvas )
		).not.toBeInTheDocument();
	} );
} );
