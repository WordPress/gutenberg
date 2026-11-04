import { describe, expect, it, vi } from 'vitest';
import { applyPostOperations, postOperationsFromProposal } from '../operations';
import { summarizeOperations } from '../suggestion-summary';
import { findNewestPostFieldProposal } from '../suggestion-undo-guard';
import { postFieldProposals } from '../../../store/reducer';
import { getEditedPostAttribute } from '../../../store/selectors';
import { getProposedNewTerms } from '../../../store/private-selectors';
import { createProposedTerms } from '../create-proposed-terms';

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

	it( 'names the new terms a suggestion would create', () => {
		expect(
			summarizeOperations(
				[ op( 'tags', [ 1 ], [ 1, 2, { name: 'Fresh' } ] ) ],
				{
					taxonomies: { tags: 'Tags' },
					termNames: { 1: 'Old', 2: 'Sport' },
				}
			)
		).toEqual( [ { label: 'Tags:', value: 'Add Sport; New tag: Fresh' } ] );
		expect(
			summarizeOperations(
				[ op( 'genres', [], [ { name: 'Jazz', parent: 4 } ] ) ],
				{ taxonomies: { genres: 'Genres' } }
			)
		).toEqual( [ { label: 'Genres:', value: 'New term: Jazz' } ] );
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

describe( 'terms proposals with new terms', () => {
	const proposals = {
		tags: {
			attribute: 'tags',
			baseline: [ 1 ],
			proposed: [ 1, { name: 'Fresh' } ],
		},
	};
	const state = ( editorIntent: string ) =>
		( {
			editorIntent,
			postFieldProposals: proposals,
			postId: 1,
			postType: 'post',
		} ) as any;

	it( 'reads as term ids only, stably, and lists the new terms apart', () => {
		const suggesting = state( 'suggest' );
		const ids = getEditedPostAttribute( suggesting, 'tags' );
		expect( ids ).toEqual( [ 1 ] );
		expect( getEditedPostAttribute( suggesting, 'tags' ) ).toBe( ids );
		expect( getProposedNewTerms( suggesting, 'tags' ) ).toEqual( [
			{ name: 'Fresh' },
		] );
		expect( getProposedNewTerms( state( 'edit' ), 'tags' ) ).toEqual( [] );
	} );
} );

describe( 'createProposedTerms', () => {
	function registryWith( saveEntityRecord: any ) {
		return {
			resolveSelect: () => ( {
				getTaxonomies: async () => [
					{ slug: 'post_tag', rest_base: 'tags' },
				],
			} ),
			dispatch: () => ( { saveEntityRecord } ),
		};
	}

	it( 'creates new terms, reusing one that exists, and keeps the rest', async () => {
		const saveEntityRecord = vi.fn( async ( _kind, _name, term ) => {
			if ( term.name === 'Taken' ) {
				throw { code: 'term_exists', data: { term_id: 7 } };
			}
			return { id: 9 };
		} );
		const excerpt = op( 'excerpt', 'a', 'b' );
		expect(
			await createProposedTerms( registryWith( saveEntityRecord ), [
				op(
					'tags',
					[ 1 ],
					[ 1, { name: 'Fresh' }, { name: 'Taken' } ]
				),
				excerpt,
			] as any )
		).toEqual( [ op( 'tags', [ 1 ], [ 1, 9, 7 ] ), excerpt ] );
		expect( saveEntityRecord ).toHaveBeenCalledWith(
			'taxonomy',
			'post_tag',
			{ name: 'Fresh' },
			{ throwOnError: true }
		);
	} );

	it( 'rejects when a term cannot be created', async () => {
		const forbidden = {
			code: 'rest_cannot_create',
			message:
				'Sorry, you are not allowed to create terms in this taxonomy.',
		};
		await expect(
			createProposedTerms(
				registryWith( async () => {
					throw forbidden;
				} ),
				[ op( 'tags', [], [ { name: 'Fresh' } ] ) ] as any
			)
		).rejects.toBe( forbidden );
	} );
} );
