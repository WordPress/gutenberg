import { describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { unlock } from '../lock-unlock';
import { syncSiteBase } from '../page/sync-site-base';

// The resolvers of `core-data` request what isn't in the store: leave those
// requests pending, so the store holds only what the tests receive.
vi.mock( import( '@wordpress/api-fetch' ) );
vi.mocked( apiFetch ).mockImplementation( () => new Promise( () => {} ) );

function createRegistryWithBase( base?: Record< string, unknown > ) {
	const registry = createRegistry();
	registry.register( coreStore );
	if ( base ) {
		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'root', '__unstableBase', base );
	}
	return registry;
}

const BASE = {
	name: 'Site',
	home: 'https://example.org',
	show_on_front: 'page',
	page_on_front: 2,
	page_for_posts: 3,
};

describe( 'syncSiteBase', () => {
	it( 'copies the saved reading settings into the base data', () => {
		const registry = createRegistryWithBase( BASE );

		syncSiteBase( registry, {
			title: 'Site',
			show_on_front: 'page',
			page_on_front: 2,
			page_for_posts: 4,
		} );

		expect(
			registry
				.select( coreStore )
				.getEntityRecord( 'root', '__unstableBase' )
		).toEqual( { ...BASE, page_for_posts: 4 } );
		expect( unlock( registry.select( coreStore ) ).getPostsPageId() ).toBe(
			'4'
		);
		expect( unlock( registry.select( coreStore ) ).getHomePage() ).toEqual(
			{ postType: 'page', postId: '2' }
		);
	} );

	it( 'leaves base data that is not loaded alone', () => {
		const registry = createRegistryWithBase();

		syncSiteBase( registry, { page_for_posts: 4 } );

		expect(
			registry
				.select( coreStore )
				.getEntityRecord( 'root', '__unstableBase' )
		).toBeUndefined();
	} );

	it( 'does nothing without saved settings', () => {
		const registry = createRegistryWithBase( BASE );

		syncSiteBase( registry, undefined );

		expect(
			registry
				.select( coreStore )
				.getEntityRecord( 'root', '__unstableBase' )
		).toEqual( BASE );
	} );
} );
