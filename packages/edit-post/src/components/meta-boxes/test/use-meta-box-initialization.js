/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { RegistryProvider, createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useMetaBoxInitialization } from '../use-meta-box-initialization';
import { STORE_NAME } from '../../../store/constants';

const storeConfig = {
	actions: {
		forceUpdate: jest.fn( () => ( { type: 'FORCE_UPDATE' } ) ),
	},
	reducer: ( state = {}, action ) =>
		action.type === 'FORCE_UPDATE' ? { ...state } : state,
};

const initializeMetaBoxes = jest.fn( () => ( {
	type: 'META_BOXES_INITIALIZED',
} ) );

function createMockStores( { isEditorReady = true, metaBoxes = [] } = {} ) {
	return {
		'core/editor': {
			...storeConfig,
			selectors: {
				__unstableIsEditorReady: jest.fn( () => isEditorReady ),
			},
		},
		[ STORE_NAME ]: {
			...storeConfig,
			actions: {
				...storeConfig.actions,
				initializeMetaBoxes,
			},
			selectors: {
				getAllMetaBoxes: jest.fn( () => metaBoxes ),
				hasMetaBoxes: jest.fn( () => metaBoxes.length > 0 ),
				getActiveMetaBoxLocations: jest.fn( () =>
					metaBoxes.length > 0 ? [ 'normal' ] : []
				),
			},
		},
	};
}

function TestComponent( { enabled } ) {
	useMetaBoxInitialization( enabled );
	return null;
}

function renderHook( registry, enabled = true ) {
	return render(
		<RegistryProvider value={ registry }>
			<TestComponent enabled={ enabled } />
		</RegistryProvider>
	);
}

describe( 'useMetaBoxInitialization', () => {
	afterEach( () => {
		initializeMetaBoxes.mockClear();
	} );

	it( 'initializes metaboxes when enabled and the editor is ready', () => {
		const mockStores = createMockStores( {
			metaBoxes: [
				{ id: 'my-metabox', title: 'My Meta Box' },
				{ id: 'another-metabox', title: 'Another' },
			],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( initializeMetaBoxes ).toHaveBeenCalled();
	} );

	it( 'does not initialize metaboxes when disabled', () => {
		const mockStores = createMockStores();
		const registry = createRegistry( mockStores );

		renderHook( registry, false );

		expect( initializeMetaBoxes ).not.toHaveBeenCalled();
	} );

	it( 'does not initialize metaboxes until the editor is ready', () => {
		const mockStores = createMockStores( { isEditorReady: false } );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( initializeMetaBoxes ).not.toHaveBeenCalled();
	} );
} );
