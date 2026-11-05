import { describe, expect, it } from 'vitest';
import { getSourceQuery, getDynamicSources } from '../dynamic-source';

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

	it( 'resolves core/media-folder to the folders collection param', () => {
		expect(
			getSourceQuery(
				{ source: 'core/media-folder', args: { folderId: 7 } },
				{ postId: 42 }
			)
		).toEqual( {
			'media-folders': [ 7 ],
			per_page: 100,
			media_type: 'image',
			orderby: 'date',
			order: 'desc',
		} );
	} );

	it( 'orders a folder gallery from the same args as an attached one', () => {
		expect(
			getSourceQuery(
				{
					source: 'core/media-folder',
					args: { folderId: 7, orderBy: 'title', order: 'asc' },
				},
				{}
			)
		).toEqual(
			expect.objectContaining( { orderby: 'title', order: 'asc' } )
		);
	} );

	it( 'returns null for a folder gallery with no folder chosen', () => {
		// Rather than a query matching every image, which would show the whole
		// media library in place of the block's empty state.
		expect(
			getSourceQuery( { source: 'core/media-folder' }, { postId: 42 } )
		).toBeNull();
	} );

	it( 'returns null for a folder id that is not a usable term id', () => {
		// Only reachable via hand-edited markup.
		[ 0, -1, 1.5, 'Holiday' ].forEach( ( folderId ) => {
			expect(
				getSourceQuery(
					{ source: 'core/media-folder', args: { folderId } },
					{ postId: 42 }
				)
			).toBeNull();
		} );
	} );

	it( 'resolves a folder gallery without a post, unlike an attached one', () => {
		// A folder names its own content, so it resolves in a template part or
		// pattern too.
		expect(
			getSourceQuery(
				{ source: 'core/media-folder', args: { folderId: 7 } },
				{ postId: undefined }
			)
		).not.toBeNull();
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

describe( 'getDynamicSources', () => {
	it( 'flags the post-relative source, and only it, as requiring a post', () => {
		const requiresPost = Object.fromEntries(
			getDynamicSources().map( ( [ name, descriptor ] ) => [
				name,
				!! descriptor.requiresPost,
			] )
		);

		expect( requiresPost ).toEqual( {
			'core/attached-media': true,
			'core/media-folder': false,
		} );
	} );

	it( 'offers the folder source only while the experiment is on', () => {
		const folderSource = getDynamicSources().find(
			( [ name ] ) => name === 'core/media-folder'
		)[ 1 ];

		// `isAvailable` reads the flag off `window`, which this environment
		// stands in for rather than running the whole file under jsdom.
		globalThis.window = {};
		try {
			expect( folderSource.isAvailable() ).toBe( false );

			globalThis.window.__experimentalMediaFolders = true;
			expect( folderSource.isAvailable() ).toBe( true );
		} finally {
			delete globalThis.window;
		}
	} );
} );
