import { describe, expect, it, vi } from 'vitest';
import { proposalsFromPendingNotes } from '../post-field-proposal-hydration';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const POST_ID = 7;
const USER_ID = 3;

function note(
	id: number,
	operations: any[],
	overrides: Record< string, any > = {}
) {
	return {
		id,
		post: POST_ID,
		author: USER_ID,
		parent: 0,
		type: 'note',
		status: 'hold',
		meta: {
			_wp_suggestion: JSON.stringify( {
				schemaVersion: 2,
				blockName: '',
				baseRevision: null,
				operations,
			} ),
		},
		...overrides,
	};
}

const op = ( attribute: string, before: any, after: any, key?: string ) => ( {
	type: 'post-attribute-set',
	attribute,
	...( key ? { key } : {} ),
	before,
	after,
} );

const hydrate = ( notes: any[] ) =>
	proposalsFromPendingNotes( notes, { postId: POST_ID, userId: USER_ID } );

describe( 'proposalsFromPendingNotes', () => {
	it( "restores the user's pending post field notes, with their note", () => {
		expect(
			hydrate( [
				note( 10, [ op( 'excerpt', 'Saved', 'Proposed' ) ] ),
				note( 11, [ op( 'meta', '', 'x', 'my_key' ) ] ),
			] )
		).toEqual( {
			excerpt: {
				attribute: 'excerpt',
				baseline: 'Saved',
				proposed: 'Proposed',
				commentId: 10,
				noteValue: 'Proposed',
			},
			'meta.my_key': {
				attribute: 'meta',
				key: 'my_key',
				baseline: '',
				proposed: 'x',
				commentId: 11,
				noteValue: 'x',
			},
		} );
	} );

	it( 'leaves other authors, resolved notes, replies and other posts alone', () => {
		const excerpt = [ op( 'excerpt', 'Saved', 'Proposed' ) ];
		expect(
			hydrate( [
				note( 1, excerpt, { author: 99 } ),
				note( 2, excerpt, { status: 'approved' } ),
				note( 3, excerpt, { parent: 1 } ),
				note( 4, excerpt, { post: 8 } ),
				note( 5, excerpt, { type: 'comment' } ),
			] )
		).toEqual( {} );
	} );

	it( 'ignores block suggestions and notes that are not suggestions', () => {
		expect(
			hydrate( [
				note( 1, [
					{
						type: 'attribute-set',
						attribute: 'content',
						before: 'a',
						after: 'b',
					},
				] ),
				{ ...note( 2, [] ), meta: {} },
				note( 3, [ op( 'meta', '', 'x' ) ] ),
			] )
		).toEqual( {} );
	} );

	it( 'keeps the newest note when two hold the same field', () => {
		expect(
			hydrate( [
				note( 21, [ op( 'title', 'A', 'C' ) ] ),
				note( 20, [ op( 'title', 'A', 'B' ) ] ),
			] ).title
		).toMatchObject( { proposed: 'C', commentId: 21 } );
	} );
} );
