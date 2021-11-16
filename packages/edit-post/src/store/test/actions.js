/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { requestMetaBoxUpdates, setIsListViewOpened } from '../actions';
import { store as editPostStore } from '..';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

function createRegistryWithStores() {
	// Create a registry and register used stores.
	const registry = createRegistry();
	[
		editPostStore,
		noticesStore,
		blockEditorStore,
		coreStore,
		interfaceStore,
		editorStore,
	].forEach( registry.register );
	return registry;
}

describe( 'actions', () => {
	describe( 'openPublishSidebar', () => {} );
} );

// TODO: to remove all below...
describe( 'actions', () => {
	describe( 'requestMetaBoxUpdates', () => {
		it( 'should yield the REQUEST_META_BOX_UPDATES action', () => {
			const fulfillment = requestMetaBoxUpdates();
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: {
					type: 'REQUEST_META_BOX_UPDATES',
				},
			} );
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: controls.select( 'core/editor', 'getCurrentPost' ),
			} );
		} );
	} );
} );
