import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkUI } from '..';

globalThis.wpVitest.mockMatchMedia();

const mockLinkControl = vi.hoisted( () => vi.fn() );

vi.mock( import( '@wordpress/block-editor' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// Render only the controls the Link UI passes in below the search field.
	LinkControl: ( props ) => {
		mockLinkControl( props );
		return props.renderControlBottom();
	},
	useBlockEditingMode: () => 'default',
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// The user is allowed to create pages.
	useSelect: ( mapSelect ) => mapSelect( () => ( { canUser: () => true } ) ),
} ) );

vi.mock( import( '../../shared' ), () => ( {
	isBlockSuggestion: () => false,
	useBlockSuggestions: () => ( {
		transformSuggestions: ( suggestions ) => suggestions,
		insertBlockFromSuggestion: vi.fn(),
	} ),
	useEntityBinding: () => ( { isBoundEntityAvailable: false } ),
	useLinkPreview: () => ( { image: undefined, badges: [] } ),
} ) );

function renderLinkUI( link: Record< string, string > ) {
	return render(
		<LinkUI
			clientId="test-client-id"
			link={ link }
			anchor={ document.body }
			onChange={ vi.fn() }
			onClose={ vi.fn() }
		/>
	);
}

describe( 'LinkUI tools', () => {
	it.each( [
		[ 'a page link', { type: 'page', kind: 'post-type' } ],
		[ 'a link detached from its page', {} ],
	] )( 'offers both "Create page" and "Add block" for %s', ( _, link ) => {
		renderLinkUI( link );

		expect(
			screen.getByRole( 'button', { name: 'Create page' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
	} );

	it( 'offers only "Add block" for a link to another entity type', () => {
		renderLinkUI( { type: 'category', kind: 'taxonomy' } );

		expect(
			screen.queryByRole( 'button', { name: 'Create page' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
	} );

	// An empty URL would equal the empty search input and turn the initial
	// suggestions off.
	it( 'passes no URL to the search for a link with an empty URL', () => {
		renderLinkUI( { url: '' } );

		expect( mockLinkControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				value: expect.objectContaining( { url: undefined } ),
			} )
		);
	} );
} );
