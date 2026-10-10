import { describe, expect, it, vi } from 'vitest';
import { applyPostOperations, postOperationsFromProposal } from '../operations';
import { summarizeOperations } from '../suggestion-summary';
import { findNewestPostFieldProposal } from '../suggestion-undo-guard';
import { postFieldProposals } from '../../../store/reducer';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const op = ( attribute: string, before: any, after: any, key?: string ) => ( {
	type: 'post-attribute-set',
	attribute,
	...( key ? { key } : {} ),
	before,
	after,
} );

describe( 'postOperationsFromProposal', () => {
	it( 'builds one op per proposal, carrying a meta key', () => {
		expect(
			postOperationsFromProposal( {
				attribute: 'meta',
				key: 'my_meta',
				baseline: '',
				proposed: 'x',
			} )
		).toEqual( [ op( 'meta', '', 'x', 'my_meta' ) ] );
	} );

	it( 'proposes nothing once the value is back at its baseline', () => {
		expect(
			postOperationsFromProposal( {
				attribute: 'categories',
				baseline: [ 1 ],
				proposed: [ 1 ],
			} )
		).toEqual( [] );
	} );
} );

describe( 'applyPostOperations', () => {
	it( 'merges meta ops by key and sets other fields', () => {
		expect(
			applyPostOperations( [
				op( 'excerpt', 'a', 'b' ),
				op( 'meta', '', 'x', 'one' ),
				op( 'meta', '', 'y', 'two' ),
			] )
		).toEqual( { excerpt: 'b', meta: { one: 'x', two: 'y' } } );
	} );
} );

describe( 'summarizeOperations for post fields', () => {
	it( 'quotes text fields', () => {
		expect(
			summarizeOperations( [ op( 'excerpt', 'Old', 'New' ) ] )
		).toEqual( [ { label: 'Excerpt:', value: '“Old” → “New”' } ] );
		expect( summarizeOperations( [ op( 'slug', 'a', 'b' ) ] ) ).toEqual( [
			{ label: 'Slug:', value: '“a” → “b”' },
		] );
	} );

	it( 'says what happens to the featured image', () => {
		const value = ( before: any, after: any ) =>
			summarizeOperations( [
				op( 'featured_media', before, after ),
			] )[ 0 ].value;
		expect( value( 0, 5 ) ).toBe( 'Set' );
		expect( value( 5, 6 ) ).toBe( 'Replace' );
		expect( value( 5, 0 ) ).toBe( 'Remove' );
	} );

	it( 'lists added and removed terms by name', () => {
		expect(
			summarizeOperations( [ op( 'categories', [ 1, 2 ], [ 2, 3 ] ) ], {
				taxonomies: { categories: 'Categories' },
				termNames: { 1: 'News', 3: 'Sport' },
			} )
		).toEqual( [
			{ label: 'Categories:', value: 'Add Sport; Remove News' },
		] );
	} );

	it( 'names a meta key', () => {
		expect(
			summarizeOperations( [ op( 'meta', '', 'x', 'my_meta' ) ] )
		).toEqual( [ { label: 'my_meta:', value: '“x”' } ] );
	} );
} );

describe( 'findNewestPostFieldProposal', () => {
	const proposal = { attribute: 'slug', baseline: 'a', proposed: 'b' };
	it( 'returns the newest proposal newer than every block capture', () => {
		const seqs = new Map( [
			[ 'slug', { proposal, seq: 5 } ],
			[ 'excerpt', { proposal, seq: 3 } ],
		] );
		expect( findNewestPostFieldProposal( seqs, 4 )?.id ).toBe( 'slug' );
		expect( findNewestPostFieldProposal( seqs, 5 ) ).toBeNull();
	} );
} );

describe( 'postFieldProposals reducer', () => {
	it( 'sets, clears, and resets proposals for another post', () => {
		let state = postFieldProposals( undefined, {
			type: 'SET_POST_FIELD_PROPOSAL',
			id: 'excerpt',
			proposal: { attribute: 'excerpt', baseline: '', proposed: 'x' },
		} );
		expect( Object.keys( state ) ).toEqual( [ 'excerpt' ] );
		state = postFieldProposals( state, {
			type: 'CLEAR_POST_FIELD_PROPOSAL',
			id: 'excerpt',
		} );
		expect( state ).toEqual( {} );
		state = postFieldProposals(
			{ slug: { attribute: 'slug', baseline: 'a', proposed: 'b' } },
			{ type: 'SET_EDITED_POST' }
		);
		expect( state ).toEqual( {} );
	} );
} );
