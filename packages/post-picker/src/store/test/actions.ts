import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store } from '../index';
import { settleRequest } from '../requests';
import { mountPostPicker } from '../../mount';

vi.mock( import( '../../mount' ), () => ( {
	mountPostPicker: vi.fn(),
} ) );

function setup() {
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

describe( 'core/post-picker actions', () => {
	beforeEach( () => {
		vi.mocked( mountPostPicker ).mockClear();
	} );

	it( 'opens the picker with the given options', () => {
		const registry = setup();

		registry.dispatch( store ).pickPosts( { postType: 'page' } );

		expect( registry.select( store ).isPostPickerOpen() ).toBe( true );
		expect(
			registry.select( store ).getPostPickerRequest()?.config
		).toEqual( { postType: 'page' } );
	} );

	it( 'mounts the picker for the registry that opened it', () => {
		const registry = setup();

		registry.dispatch( store ).pickPosts( { postType: 'page' } );

		// Thunks receive a wrapper around the registry, so check that the
		// mounted registry reads the same store rather than comparing objects.
		expect( mountPostPicker ).toHaveBeenCalledTimes( 1 );
		const mountedRegistry =
			vi.mocked( mountPostPicker ).mock.calls[ 0 ][ 0 ];
		expect( mountedRegistry.select( store ).isPostPickerOpen() ).toBe(
			true
		);
	} );

	it( 'passes the same registry each time it opens', () => {
		const registry = setup();

		registry.dispatch( store ).pickPosts( { postType: 'page' } );
		registry.dispatch( store ).pickPosts( { postType: 'post' } );

		const [ [ first ], [ second ] ] =
			vi.mocked( mountPostPicker ).mock.calls;
		expect( first ).toBe( second );
	} );

	it( 'resolves with the selected posts', async () => {
		const registry = setup();
		const posts = [ { id: 1, type: 'page' } ];

		const promise = registry
			.dispatch( store )
			.pickPosts( { postType: 'page' } );
		const request = registry.select( store ).getPostPickerRequest();
		settleRequest( request!.id, posts );
		registry.dispatch( store ).closePostPicker();

		await expect( promise ).resolves.toBe( posts );
		expect( registry.select( store ).isPostPickerOpen() ).toBe( false );
	} );

	it( 'resolves with null when closed', async () => {
		const registry = setup();

		const promise = registry
			.dispatch( store )
			.pickPosts( { postType: 'page' } );
		registry.dispatch( store ).closePostPicker();

		await expect( promise ).resolves.toBeNull();
		expect( registry.select( store ).isPostPickerOpen() ).toBe( false );
	} );

	it( 'resolves an open request with null when a new one opens', async () => {
		const registry = setup();

		const first = registry
			.dispatch( store )
			.pickPosts( { postType: 'page' } );
		registry.dispatch( store ).pickPosts( { postType: 'post' } );

		await expect( first ).resolves.toBeNull();
		expect(
			registry.select( store ).getPostPickerRequest()?.config
		).toEqual( { postType: 'post' } );
	} );
} );
