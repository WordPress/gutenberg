import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteReactions } from '../note-reactions';
import { useNoteReactions } from '../use-note-reactions';
import { useReactionEmojis } from '../reaction-emojis';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

// The editor store pulls in viewport listeners that jsdom can't run.
vi.mock( import( '../../../../store' ), () => ( { store: {} } ) as never );
vi.mock( import( '../use-note-reactions' ) );
vi.mock( import( '../reaction-emojis' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useReactionEmojis: vi.fn(),
} ) );

const HEART = { emoji: '❤️', hexKey: '2764', label: 'heart' };

describe( 'NoteReactions', () => {
	it( 'keeps the pill of an emoji the site no longer offers, for removal only', () => {
		vi.mocked( useReactionEmojis ).mockReturnValue( [ HEART ] );
		vi.mocked( useNoteReactions ).mockReturnValue( [
			{
				'1f984': { count: 1, current_user_reaction: 0 },
				'1f44d': { count: 1, current_user_reaction: 42 },
			},
			async () => {},
		] );
		render(
			<NoteReactions noteId={ 7 } canReact={ false } disabled={ false } />
		);
		const [ unicorn, thumbsUp ] = screen.getAllByRole( 'button' );

		// Neither is offered, so each renders from its hex key.
		expect( unicorn ).toHaveTextContent( '🦄' );
		expect( thumbsUp ).toHaveTextContent( '👍' );
		// Someone else's reaction cannot be joined; your own can be removed.
		// The Design System Button stays focusable when disabled.
		expect( unicorn ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( thumbsUp ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	it( 'offers no add-reaction picker when the site offers no emoji', () => {
		vi.mocked( useReactionEmojis ).mockReturnValue( [] );
		vi.mocked( useNoteReactions ).mockReturnValue( [ {}, async () => {} ] );
		const { container } = render(
			<NoteReactions noteId={ 7 } canReact disabled={ false } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'offers the add-reaction picker when the site offers emoji', () => {
		vi.mocked( useReactionEmojis ).mockReturnValue( [ HEART ] );
		vi.mocked( useNoteReactions ).mockReturnValue( [ {}, async () => {} ] );
		render( <NoteReactions noteId={ 7 } canReact disabled={ false } /> );

		expect(
			screen.getByRole( 'button', { name: 'Add reaction' } )
		).toBeInTheDocument();
	} );
} );
