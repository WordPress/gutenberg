import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import { useMetaBoxInitialization } from '../use-meta-box-initialization';
import { STORE_NAME } from '../../../store/constants';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

// Mock unlock to be an identity function so private actions are directly accessible.
vi.mock( import( '../../../lock-unlock' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	unlock: ( value ) => value,
} ) );

const storeConfig = {
	actions: {
		forceUpdate: vi.fn( () => ( { type: 'FORCE_UPDATE' } ) ),
	},
	reducer: ( state = {}, action ) =>
		action.type === 'FORCE_UPDATE' ? { ...state } : state,
};

const initializeMetaBoxes = vi.fn( () => ( {
	type: 'META_BOXES_INITIALIZED',
} ) );

const updateEditorSettings = vi.fn( () => ( {
	type: 'UPDATE_EDITOR_SETTINGS',
} ) );

function createMockStores( { isEditorReady = true, metaBoxes = [] } = {} ) {
	return {
		'core/editor': {
			...storeConfig,
			actions: {
				...storeConfig.actions,
				updateEditorSettings,
			},
			selectors: {
				__unstableIsEditorReady: vi.fn( () => isEditorReady ),
			},
		},
		[ STORE_NAME ]: {
			...storeConfig,
			actions: {
				...storeConfig.actions,
				initializeMetaBoxes,
			},
			selectors: {
				getAllMetaBoxes: vi.fn( () => metaBoxes ),
				hasMetaBoxes: vi.fn( () => metaBoxes.length > 0 ),
				getActiveMetaBoxLocations: vi.fn( () =>
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
		updateEditorSettings.mockClear();
	} );

	it( 'initializes meta boxes once the editor is ready', () => {
		const registry = createRegistry(
			createMockStores( {
				metaBoxes: [ { id: 'my-metabox', title: 'My Meta Box' } ],
			} )
		);

		renderHook( registry );

		expect( initializeMetaBoxes ).toHaveBeenCalled();
	} );

	it( 'does not initialize meta boxes before the editor is ready', () => {
		const registry = createRegistry(
			createMockStores( { isEditorReady: false } )
		);

		renderHook( registry );

		expect( initializeMetaBoxes ).not.toHaveBeenCalled();
	} );

	it( 'disables visual revisions when metaboxes are present', () => {
		const mockStores = createMockStores( {
			metaBoxes: [ { id: 'my-metabox', title: 'My Meta Box' } ],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( updateEditorSettings ).toHaveBeenCalledWith( {
			disableVisualRevisions: true,
		} );
	} );

	it( 'does not disable visual revisions when there are no metaboxes', () => {
		const mockStores = createMockStores( { metaBoxes: [] } );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( updateEditorSettings ).not.toHaveBeenCalled();
	} );
} );
