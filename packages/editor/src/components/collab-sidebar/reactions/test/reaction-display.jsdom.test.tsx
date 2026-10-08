import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import ReactionDisplay, { invalidateReactionNames } from '../reaction-display';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/api-fetch' ) );

const NOTE_ID = 7;

const REACTIONS = [
	{ author_name: 'Ada', content: { raw: '2764' } },
	{ author_name: 'Grace', content: { raw: '1f44d' } },
	{ author_name: 'Linus', content: { raw: '2764' } },
];

function renderPills() {
	render(
		<ReactionDisplay
			noteId={ NOTE_ID }
			reactions={ {
				2764: { count: 2, current_user_reaction: 0 },
				'1f44d': { count: 1, current_user_reaction: 42 },
			} }
			onToggleReaction={ () => {} }
		/>
	);
	return screen.getAllByRole( 'button' );
}

describe( 'ReactionDisplay', () => {
	beforeEach( () => {
		invalidateReactionNames( NOTE_ID );
		vi.mocked( apiFetch ).mockReset();
		vi.mocked( apiFetch ).mockResolvedValue( REACTIONS );
	} );

	it( 'marks a pill pressed only when the current user reacted with it', () => {
		const [ heart, thumbsUp ] = renderPills();

		expect( heart ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( thumbsUp ).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	it( 'keeps the pill of an emoji the site no longer offers, for removal only', () => {
		render(
			<ReactionDisplay
				noteId={ NOTE_ID }
				reactions={ {
					'1f984': { count: 1, current_user_reaction: 0 },
					'1f44d': { count: 1, current_user_reaction: 42 },
				} }
				onToggleReaction={ () => {} }
			/>
		);
		const [ unicorn, thumbsUp ] = screen.getAllByRole( 'button' );

		// Neither is a default, so each renders from its hex key.
		expect( unicorn ).toHaveTextContent( '🦄' );
		expect( thumbsUp ).toHaveTextContent( '👍' );
		// Someone else's reaction cannot be joined; your own can be removed.
		// The Design System Button stays focusable when disabled.
		expect( unicorn ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( thumbsUp ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	it( 'fetches the reactions on a note once for all of its pills', async () => {
		const [ heart, thumbsUp ] = renderPills();

		fireEvent.focus( heart );
		fireEvent.focus( thumbsUp );

		await waitFor( () =>
			expect( heart ).toHaveAccessibleName(
				expect.stringContaining( 'Ada and Linus' )
			)
		);
		await waitFor( () =>
			expect( thumbsUp ).toHaveAccessibleName(
				expect.stringContaining( 'Grace' )
			)
		);
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'refetches after the note is invalidated', async () => {
		const [ heart ] = renderPills();

		fireEvent.focus( heart );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );

		invalidateReactionNames( NOTE_ID );
		fireEvent.focus( heart );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 2 ) );
	} );
} );
