import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useNoteActions } from '../hooks';

// The editor store touches matchMedia at import time.
vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/api-fetch' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

type Summary = Record<
	string,
	{ count: number; reacted: boolean; my_reaction_id?: number }
>;
type NoteRecord = { id: number; reaction_summary: Summary };

/*
 * A single fake store behind both `useSelect` and `useDispatch`, so the
 * hook's cache reads see its own writes.
 */
const records = new Map< number, NoteRecord >();
let nextReactionId = 100;
const actions = {
	createNotice: vi.fn(),
	saveEntityRecord: vi.fn( async () => ( { id: nextReactionId++ } ) ),
	deleteEntityRecord: vi.fn( async () => {} ),
	receiveEntityRecords: vi.fn(
		( _kind: string, _name: string, items: NoteRecord[] ) => {
			items.forEach( ( item ) => records.set( item.id, item ) );
		}
	),
	getEntityRecord: ( _kind: string, _name: string, id: number ) =>
		records.get( id ),
	getCurrentPostId: () => 1,
	updateBlockAttributes: vi.fn(),
};

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		useDispatch: () => actions,
		useSelect: () => actions,
	} as unknown as typeof original;
} );

const mockApiFetch = vi.mocked( apiFetch );

function deferred< T >() {
	let resolve!: ( value: T ) => void;
	const promise = new Promise< T >( ( r ) => {
		resolve = r;
	} );
	return { promise, resolve };
}

describe( 'useNoteActions onToggleReaction', () => {
	beforeEach( () => {
		records.clear();
		records.set( 7, { id: 7, reaction_summary: {} } );
		mockApiFetch.mockReset();
	} );

	it( 'counts concurrent adds that converge on one reaction once', async () => {
		// The server dedupes concurrent inserts and returns the surviving
		// row's ID to every request; the refreshes that would correct the
		// count all fail.
		actions.saveEntityRecord.mockResolvedValue( { id: 100 } );
		mockApiFetch.mockRejectedValue( new Error( 'offline' ) );

		const { result } = renderHook( () => useNoteActions( {} ) );

		await act( async () => {
			await Promise.all( [
				result.current.onToggleReaction( {
					commentId: 7,
					emoji: 'heart',
				} ),
				result.current.onToggleReaction( {
					commentId: 7,
					emoji: 'heart',
				} ),
			] );
		} );

		expect( records.get( 7 )?.reaction_summary ).toEqual( {
			heart: { count: 1, reacted: true, my_reaction_id: 100 },
		} );

		// Removing the one surviving reaction leaves no phantom count.
		const { result: after } = renderHook( () =>
			useNoteActions( { 7: records.get( 7 )!.reaction_summary } )
		);
		await act( async () => {
			await after.current.onToggleReaction( {
				commentId: 7,
				emoji: 'heart',
			} );
		} );

		expect( records.get( 7 )?.reaction_summary ).toEqual( {} );
		actions.saveEntityRecord.mockImplementation( async () => ( {
			id: nextReactionId++,
		} ) );
	} );

	it( 'ignores a refresh that a newer reaction has overtaken', async () => {
		const heartRefresh = deferred< unknown >();
		const rocketRefresh = deferred< unknown >();
		mockApiFetch
			.mockReturnValueOnce( heartRefresh.promise )
			.mockReturnValueOnce( rocketRefresh.promise );

		const { result } = renderHook( () => useNoteActions( {} ) );

		let heartToggle!: Promise< void >;
		let rocketToggle!: Promise< void >;
		await act( async () => {
			heartToggle = result.current.onToggleReaction( {
				commentId: 7,
				emoji: 'heart',
			} );
			rocketToggle = result.current.onToggleReaction( {
				commentId: 7,
				emoji: 'rocket',
			} );
			// Let both mutations land, so both refreshes are in flight.
			await Promise.resolve();
			await Promise.resolve();
		} );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );

		// The newer refresh sees both reactions and lands first.
		await act( async () => {
			rocketRefresh.resolve( {
				id: 7,
				reaction_summary: {
					heart: { count: 1, reacted: true, my_reaction_id: 100 },
					rocket: { count: 1, reacted: true, my_reaction_id: 101 },
				},
			} );
			await rocketToggle;
		} );

		// The older snapshot, taken before the rocket landed, arrives last.
		await act( async () => {
			heartRefresh.resolve( {
				id: 7,
				reaction_summary: {
					heart: { count: 1, reacted: true, my_reaction_id: 100 },
				},
			} );
			await heartToggle;
		} );

		expect( records.get( 7 )?.reaction_summary ).toEqual( {
			heart: { count: 1, reacted: true, my_reaction_id: 100 },
			rocket: { count: 1, reacted: true, my_reaction_id: 101 },
		} );
	} );
} );
