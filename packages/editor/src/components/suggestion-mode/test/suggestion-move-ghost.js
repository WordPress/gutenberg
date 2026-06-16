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

	it( 'renders a non-interactive note exposing the original position to assistive tech', () => {
		render( <SuggestionMoveGhost moved={ moved } /> );
		const ghost = screen.getByTestId( 'suggestion-move-ghost' );
		expect( ghost ).toBeInTheDocument();
		// The placeholder is a note (not aria-hidden) so screen-reader users
		// also get an original-position cue; it stays non-editable.
		expect( ghost ).toHaveAttribute( 'role', 'note' );
		expect( ghost ).not.toHaveAttribute( 'aria-hidden' );
		expect( ghost ).toHaveAttribute( 'contenteditable', 'false' );
		// The screen-reader sentence frames it as an original position.
		expect(
			screen.getByText( 'Original position of moved Paragraph block.' )
		).toBeInTheDocument();
	} );

	it( 'hides the decorative label and excerpt from assistive tech to avoid a double read', () => {
		render( <SuggestionMoveGhost moved={ moved } /> );
		// The visible label and excerpt duplicate the canvas treatment, so
		// they are aria-hidden — the VisuallyHidden sentence is the single
		// accessible cue.
		expect(
			screen.getByText( /Moved from here: Paragraph/ ).closest( 'span' )
		).toHaveAttribute( 'aria-hidden', 'true' );
		expect(
			screen.getByText( 'Hello world' ).closest( 'span' )
		).toHaveAttribute( 'aria-hidden', 'true' );
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
