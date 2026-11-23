import { describe, expect, it, vi } from 'vitest';
import { createRegistry, type StoreDescriptor } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { store } from '..';

vi.mock( import( '@wordpress/api-fetch' ) );

const blockDirectoryStore = store as unknown as StoreDescriptor;

describe( 'getDownloadableBlocks', () => {
	it.each( [
		[ 'rock & roll', 'rock%20%26%20roll' ],
		[ 'c#', 'c%23' ],
		[ 'c++', 'c%2B%2B' ],
		[ '100%', '100%25' ],
	] )(
		'sends the search term "%s" encoded in the request path',
		async ( term, encodedTerm ) => {
			vi.mocked( apiFetch ).mockResolvedValue( [] );
			const registry = createRegistry();
			registry.register( blockDirectoryStore );

			await registry
				.resolveSelect( blockDirectoryStore )
				.getDownloadableBlocks( term );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `wp/v2/block-directory/search?term=${ encodedTerm }`,
			} );
		}
	);
} );
