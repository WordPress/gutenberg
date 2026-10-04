import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import ReactionDisplay, { invalidateReactionNames } from '../reaction-display';

vi.mock( import( '@wordpress/api-fetch' ) );

const TARGET = { kind: 'note', id: 7 } as const;

const REACTIONS = [
	{ author_name: 'Ada', content: { raw: '2764' } },
	{ author_name: 'Grace', content: { raw: '1f44d' } },
	{ author_name: 'Linus', content: { raw: '2764' } },
];

function renderPills() {
	render(
		<ReactionDisplay
			target={ TARGET }
			reactions={ {
				2764: { count: 2 },
				'1f44d': { count: 1 },
			} }
			onToggleReaction={ () => {} }
		/>
	);
	return screen.getAllByRole( 'button' );
}

describe( 'ReactionDisplay', () => {
	beforeEach( () => {
		invalidateReactionNames( TARGET );
		vi.mocked( apiFetch ).mockReset();
		vi.mocked( apiFetch ).mockResolvedValue( REACTIONS );
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

		invalidateReactionNames( TARGET );
		fireEvent.focus( heart );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 2 ) );
	} );
} );
