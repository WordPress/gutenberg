/**
 * Internal dependencies
 */
import { getSourceQuery } from '../dynamic-source';

describe( 'getSourceQuery', () => {
	it( 'resolves the core/attached-media anchor to the REST `parent` param with default ordering', () => {
		expect(
			getSourceQuery( { source: 'core/attached-media' }, { postId: 42 } )
		).toEqual( {
			parent: 42,
			per_page: 100,
			media_type: 'image',
			orderby: 'date',
			order: 'desc',
		} );
	} );

	it( 'maps the camelCase `args` ordering to the REST params', () => {
		expect(
			getSourceQuery(
				{
					source: 'core/attached-media',
					args: { orderBy: 'title', order: 'asc' },
				},
				{ postId: 7 }
			)
		).toEqual( {
			parent: 7,
			per_page: 100,
			media_type: 'image',
			orderby: 'title',
			order: 'asc',
		} );
	} );

	it( 'ignores args it does not explicitly map', () => {
		expect(
			getSourceQuery(
				{ source: 'core/attached-media', args: { author: 5 } },
				{ postId: 7 }
			)
		).toEqual( {
			parent: 7,
			per_page: 100,
			media_type: 'image',
			orderby: 'date',
			order: 'desc',
		} );
	} );

	it( 'coerces unexpected ordering values back to the defaults', () => {
		// Only reachable via hand-edited markup; mirrors the server resolver's
		// allow list so the preview never issues an invalid REST query.
		expect(
			getSourceQuery(
				{
					source: 'core/attached-media',
					args: { orderBy: 'menu_order', order: 'sideways' },
				},
				{ postId: 7 }
			)
		).toEqual( {
			parent: 7,
			per_page: 100,
			media_type: 'image',
			orderby: 'date',
			order: 'desc',
		} );
	} );

	it( 'returns null when there is no post to anchor to', () => {
		expect(
			getSourceQuery(
				{ source: 'core/attached-media' },
				{ postId: undefined }
			)
		).toBeNull();
	} );

	it( 'returns null for an unknown source', () => {
		expect(
			getSourceQuery( { source: 'notARealSource' }, { postId: 1 } )
		).toBeNull();
	} );

	it( 'returns null for an empty/absent source', () => {
		expect( getSourceQuery( undefined, { postId: 1 } ) ).toBeNull();
	} );
} );
