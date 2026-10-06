import { describe, expect, it, vi } from 'vitest';
import { applyReactionDelta } from '../use-reaction';

// The editor store pulls in viewport listeners that jsdom can't run, and
// `applyReactionDelta` never touches it.
vi.mock( import( '../../../../store' ), () => ( { store: {} } ) as never );

describe( 'applyReactionDelta', () => {
	it( 'records the added reaction as the current user reaction', () => {
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 1, current_user_reaction: 0 } },
		};

		expect(
			applyReactionDelta( note, '2764', 99 ).reaction_summary
		).toEqual( { 2764: { count: 2, current_user_reaction: 99 } } );
	} );

	it( 'ignores an added reaction that is already counted', () => {
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 2, current_user_reaction: 99 } },
		};

		expect( applyReactionDelta( note, '2764', 99 ) ).toBe( note );
	} );

	it( 'clears the current user reaction when one is removed', () => {
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 2, current_user_reaction: 99 } },
		};

		expect( applyReactionDelta( note, '2764' ).reaction_summary ).toEqual( {
			2764: { count: 1, current_user_reaction: 0 },
		} );
	} );

	it( 'drops the entry when the last reaction is removed', () => {
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 1, current_user_reaction: 99 } },
		};

		expect( applyReactionDelta( note, '2764' ).reaction_summary ).toEqual(
			{}
		);
	} );
} );
