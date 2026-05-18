/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import SuggestionMoveGhost from '../suggestion-move-ghost';

// Fully isolate this presentational unit: stub the store read, the block
// registry, and the icon so the test doesn't pull the real data/blocks
// module graph.
jest.mock( '@wordpress/data', () => ( {
	useSelect: ( fn ) =>
		fn( () => ( {
			getBlockAttributes: () => ( {
				content: '<strong>Hello</strong> world',
			} ),
		} ) ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	BlockIcon: () => null,
	store: 'core/block-editor',
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	getBlockType: ( name ) =>
		name === 'core/paragraph'
			? { title: 'Paragraph', icon: undefined }
			: undefined,
} ) );

jest.mock( '../../collab-sidebar/utils', () => ( {
	getAvatarBorderColor: ( id ) => `#color${ id }`,
} ) );

describe( 'SuggestionMoveGhost', () => {
	const moved = {
		clientId: 'm1',
		name: 'core/paragraph',
		authorId: 7,
		fromAnchorClientId: null,
		fromParentClientId: '',
		fromIndex: 0,
	};

	it( 'renders a non-interactive, aria-hidden placeholder with the block title', () => {
		render( <SuggestionMoveGhost moved={ moved } /> );
		const ghost = screen.getByTestId( 'suggestion-move-ghost' );
		expect( ghost ).toBeInTheDocument();
		expect( ghost ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( ghost ).toHaveAttribute( 'contenteditable', 'false' );
		expect(
			screen.getByText( /Moved from here: Paragraph/ )
		).toBeInTheDocument();
	} );

	it( 'shows a tag-stripped, trimmed excerpt of the block content', () => {
		render( <SuggestionMoveGhost moved={ moved } /> );
		expect( screen.getByText( 'Hello world' ) ).toBeInTheDocument();
	} );

	it( 'tints with the suggester avatar color via a CSS custom property', () => {
		render( <SuggestionMoveGhost moved={ moved } /> );
		const ghost = screen.getByTestId( 'suggestion-move-ghost' );
		expect(
			ghost.style.getPropertyValue( '--suggestion-author-color' )
		).toBe( '#color7' );
	} );

	it( 'omits the author color property when authorId is null', () => {
		render(
			<SuggestionMoveGhost moved={ { ...moved, authorId: null } } />
		);
		const ghost = screen.getByTestId( 'suggestion-move-ghost' );
		expect(
			ghost.style.getPropertyValue( '--suggestion-author-color' )
		).toBe( '' );
	} );
} );
