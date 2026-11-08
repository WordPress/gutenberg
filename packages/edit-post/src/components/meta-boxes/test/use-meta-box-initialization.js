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

// Mock unlock to be an identity function so private actions are directly accessible.
jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( value ) => value,
} ) );

const storeConfig = {
	actions: {
		forceUpdate: jest.fn( () => ( { type: 'FORCE_UPDATE' } ) ),
	},
	reducer: ( state = {}, action ) =>
		action.type === 'FORCE_UPDATE' ? { ...state } : state,
};

const setCollaborationSupported = jest.fn( () => ( {
	type: 'SET_COLLABORATION_SUPPORTED',
} ) );

const initializeMetaBoxes = jest.fn( () => ( {
	type: 'META_BOXES_INITIALIZED',
} ) );

const updateEditorSettings = jest.fn( () => ( {
	type: 'UPDATE_EDITOR_SETTINGS',
} ) );

function createMockStores( {
	isEditorReady = true,
	isCollaborationEnabled = true,
	metaBoxes = [],
} = {} ) {
	return {
		'core/editor': {
			...storeConfig,
			actions: {
				...storeConfig.actions,
				updateEditorSettings,
			},
			selectors: {
				__unstableIsEditorReady: jest.fn( () => isEditorReady ),
				isCollaborationEnabledForCurrentPost: jest.fn(
					() => isCollaborationEnabled
				),
			},
		},
		core: {
			...storeConfig,
			actions: {
				...storeConfig.actions,
				setCollaborationSupported,
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
		setCollaborationSupported.mockClear();
		initializeMetaBoxes.mockClear();
		updateEditorSettings.mockClear();
	} );

	it( 'disables collaboration when metaboxes are present', () => {
		const mockStores = createMockStores( {
			metaBoxes: [
				{ id: 'my-metabox', title: 'My Meta Box' },
				{ id: 'another-metabox', title: 'Another' },
			],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( initializeMetaBoxes ).toHaveBeenCalled();
		expect( setCollaborationSupported ).toHaveBeenCalledWith( false );
	} );

	it( 'does not disable collaboration when all metaboxes are rtcCompatible', () => {
		const mockStores = createMockStores( {
			metaBoxes: [
				{
					id: 'my-metabox',
					title: 'My Meta Box',
					__rtc_compatible: true,
				},
				{
					id: 'another-metabox',
					title: 'Another',
					__rtc_compatible: true,
				},
			],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( initializeMetaBoxes ).toHaveBeenCalled();
		expect( setCollaborationSupported ).not.toHaveBeenCalled();
	} );

	it( 'disables collaboration when some metaboxes lack rtcCompatible', () => {
		const mockStores = createMockStores( {
			metaBoxes: [
				{
					id: 'compatible-metabox',
					title: 'Compatible',
					__rtc_compatible: true,
				},
				{ id: 'incompatible-metabox', title: 'Incompatible' },
			],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( setCollaborationSupported ).toHaveBeenCalledWith( false );
	} );

	it( 'does not disable collaboration when the only metabox is rtcCompatible', () => {
		const mockStores = createMockStores( {
			metaBoxes: [
				{
					id: 'compatible-metabox',
					title: 'Compatible',
					__rtc_compatible: true,
				},
			],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( setCollaborationSupported ).not.toHaveBeenCalled();
	} );

	it( 'does not disable collaboration when there are no metaboxes', () => {
		const mockStores = createMockStores( {
			metaBoxes: [],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( setCollaborationSupported ).not.toHaveBeenCalled();
	} );

	it( 'does not disable collaboration when collaboration is not enabled', () => {
		const mockStores = createMockStores( {
			isCollaborationEnabled: false,
			metaBoxes: [ { id: 'my-metabox', title: 'My Meta Box' } ],
		} );
		const registry = createRegistry( mockStores );

		renderHook( registry );

		expect( setCollaborationSupported ).not.toHaveBeenCalled();
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
