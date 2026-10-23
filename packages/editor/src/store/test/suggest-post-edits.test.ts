import { describe, expect, it } from 'vitest';
import {
	classifySuggestedPostEdits,
	isPostValueEqual,
	stripSuggestedPostSave,
} from '../suggest-post-edits';

const current: Record< string, any > = {
	comment_status: 'open',
	excerpt: 'Saved',
	categories: [ 1, 2 ],
	meta: { footnotes: '[]', my_meta: 'saved' },
};
const getCurrentValue = ( key: string ) => current[ key ];

describe( 'classifySuggestedPostEdits', () => {
	it( 'passes content edits through', () => {
		const blocks: any[] = [];
		expect(
			classifySuggestedPostEdits(
				{ blocks, content: 'x', selection: {} },
				{ getCurrentValue }
			)
		).toEqual( {
			passthrough: { blocks, content: 'x', selection: {} },
			proposals: [],
			refused: [],
		} );
	} );

	it( 'refuses a changed post field nothing can propose', () => {
		expect(
			classifySuggestedPostEdits(
				{ comment_status: 'closed' },
				{ getCurrentValue }
			)
		).toEqual( {
			passthrough: {},
			proposals: [],
			refused: [ 'comment_status' ],
		} );
	} );

	it( 'drops a field repeated at its current value', () => {
		expect(
			classifySuggestedPostEdits(
				{ comment_status: 'open', categories: [ 1, 2 ] },
				{ getCurrentValue }
			)
		).toEqual( { passthrough: {}, proposals: [], refused: [] } );
	} );

	it( 'proposes a changed field the caller can propose', () => {
		expect(
			classifySuggestedPostEdits(
				{ excerpt: 'New', comment_status: 'closed' },
				{
					getCurrentValue,
					isProposable: ( attribute ) => attribute === 'excerpt',
				}
			)
		).toEqual( {
			passthrough: {},
			proposals: [ { attribute: 'excerpt', value: 'New' } ],
			refused: [ 'comment_status' ],
		} );
	} );

	it( 'sorts meta keys one by one, passing content-derived meta', () => {
		expect(
			classifySuggestedPostEdits(
				{
					meta: {
						footnotes: '[{"id":"a"}]',
						my_meta: 'changed',
						other: 'saved',
					},
				},
				{
					getCurrentValue: ( key ) =>
						key === 'meta'
							? { ...current.meta, other: 'saved' }
							: current[ key ],
					isProposable: ( attribute, key ) =>
						attribute === 'meta' && key === 'my_meta',
				}
			)
		).toEqual( {
			passthrough: { meta: { footnotes: '[{"id":"a"}]' } },
			proposals: [
				{ attribute: 'meta', key: 'my_meta', value: 'changed' },
			],
			refused: [],
		} );
	} );

	it( 'refuses a changed meta key nothing can propose', () => {
		expect(
			classifySuggestedPostEdits(
				{ meta: { my_meta: 'changed' } },
				{ getCurrentValue }
			).refused
		).toEqual( [ 'meta.my_meta' ] );
	} );
} );

describe( 'stripSuggestedPostSave', () => {
	it( 'keeps only the id, the content and content-derived meta', () => {
		expect(
			stripSuggestedPostSave( {
				id: 7,
				content: '<p>x</p>',
				excerpt: 'Staged',
				comment_status: 'closed',
				meta: { footnotes: '[]', my_meta: 'staged' },
			} )
		).toEqual( {
			id: 7,
			content: '<p>x</p>',
			meta: { footnotes: '[]' },
		} );
	} );

	it( 'drops meta that holds no content-derived key', () => {
		expect(
			stripSuggestedPostSave( { id: 7, meta: { my_meta: 'x' } } )
		).toEqual( { id: 7 } );
	} );
} );

describe( 'isPostValueEqual', () => {
	it( 'compares arrays and objects structurally', () => {
		expect( isPostValueEqual( [ 1, 2 ], [ 1, 2 ] ) ).toBe( true );
		expect( isPostValueEqual( [ 1, 2 ], [ 2, 1 ] ) ).toBe( false );
		expect( isPostValueEqual( { a: 1, b: 2 }, { b: 2, a: 1 } ) ).toBe(
			true
		);
		expect( isPostValueEqual( 0, null ) ).toBe( false );
		expect( isPostValueEqual( '', undefined ) ).toBe( false );
	} );
} );
