import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { applyReactionDelta, useReaction } from '../use-reaction';

const mockDispatch = vi.hoisted( () => vi.fn() );
vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: mockDispatch,
	useSelect: ( () => ( {
		getEntityRecord: () => undefined,
		getCurrentPostId: () => 1,
	} ) ) as never,
} ) );
vi.mock( import( '@wordpress/api-fetch' ), () => ( {
	default: vi.fn( () => Promise.reject( new Error() ) ) as never,
} ) );

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
			applyReactionDelta( note, '2764', { added: 99 } ).reaction_summary
		).toEqual( { 2764: { count: 2, current_user_reaction: 99 } } );
	} );

	it( 'ignores an added reaction that is already counted', () => {
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 2, current_user_reaction: 99 } },
		};

		expect( applyReactionDelta( note, '2764', { added: 99 } ) ).toBe(
			note
		);
	} );

	it( 'clears the current user reaction when one is removed', () => {
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 2, current_user_reaction: 99 } },
		};

		expect(
			applyReactionDelta( note, '2764', { removed: 99 } ).reaction_summary
		).toEqual( {
			2764: { count: 1, current_user_reaction: 0 },
		} );
	} );

	it( 'drops the entry when the last reaction is removed', () => {
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 1, current_user_reaction: 99 } },
		};

		expect(
			applyReactionDelta( note, '2764', { removed: 99 } ).reaction_summary
		).toEqual( {} );
	} );

	it( 'ignores a removal another refresh already folded in', () => {
		// Someone else's reaction remains after a refresh cleared ours.
		const note = {
			id: 1,
			reaction_summary: { 2764: { count: 1, current_user_reaction: 0 } },
		};

		expect( applyReactionDelta( note, '2764', { removed: 99 } ) ).toBe(
			note
		);
	} );
} );

describe( 'useReaction', () => {
	it( 'ignores a repeat toggle while the first is still pending', async () => {
		let resolveSave: ( value: { id: number } ) => void = () => {};
		const saveEntityRecord = vi.fn(
			() =>
				new Promise< { id: number } >( ( resolve ) => {
					resolveSave = resolve;
				} )
		);
		mockDispatch.mockReturnValue( {
			createNotice: vi.fn(),
			saveEntityRecord,
			deleteEntityRecord: vi.fn(),
			receiveEntityRecords: vi.fn(),
		} );

		const { result } = renderHook( () =>
			useReaction( { id: 7, reaction_summary: {} } )
		);

		let first: Promise< void > = Promise.resolve();
		await act( async () => {
			first = result.current.toggleReaction( '2764' );
			await result.current.toggleReaction( '2764' );
		} );
		expect( saveEntityRecord ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			resolveSave( { id: 99 } );
			await first;
		} );
	} );
} );
