/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
import { dispatch, resolveSelect, select } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as coreDataStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { initializeEditor } from '../';

const FILTER_NAME = 'editor.CollaborationNotificationPreferenceDefaults';
const FILTER_NAMESPACE = 'test/collaboration-notification-defaults';

const setDefaults = jest.fn();
const reapplyBlockTypeFilters = jest.fn();
const setupEditor = jest.fn();

const asyncSelectors = new Proxy(
	{},
	{
		get: () => jest.fn( () => Promise.resolve( null ) ),
	}
);

const coreDataSelectors = new Proxy(
	{},
	{
		get: () => jest.fn( () => null ),
	}
);

jest.mock( '@wordpress/blocks', () => ( {
	store: 'core/blocks',
} ) );
jest.mock( '@wordpress/block-library', () => ( {
	registerCoreBlocks: jest.fn(),
	__experimentalRegisterExperimentalCoreBlocks: jest.fn(),
} ) );
jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );
jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	resolveSelect: jest.fn(),
	select: jest.fn(),
} ) );
jest.mock( '@wordpress/deprecated', () => jest.fn() );
jest.mock( '@wordpress/element', () => ( {
	createRoot: jest.fn( () => ( { render: jest.fn() } ) ),
	StrictMode: ( { children } ) => children,
} ) );
jest.mock( '@wordpress/editor', () => ( {
	store: 'core/editor',
	privateApis: {},
} ) );
jest.mock( '@wordpress/preferences', () => ( {
	store: 'core/preferences',
} ) );
jest.mock( '@wordpress/widgets', () => ( {
	registerLegacyWidgetBlock: jest.fn(),
	registerWidgetGroupBlock: jest.fn(),
} ) );
jest.mock( '@wordpress/api-fetch', () => ( {
	privateApis: {},
} ) );
jest.mock(
	'../components/back-button/fullscreen-mode-close',
	() => () => null
);
jest.mock( '../components/layout', () => () => null );
jest.mock( '../lock-unlock', () => ( {
	unlock: () => ( {
		BackButton: () => null,
		clearPreloadedData: jest.fn(),
		enablePreloadMultiUse: jest.fn(),
		registerCoreBlockBindingsSources: jest.fn(),
	} ),
} ) );
jest.mock( '../store', () => ( {
	store: 'core/edit-post',
} ) );

describe( 'initializeEditor', () => {
	beforeEach( () => {
		document.body.innerHTML = '<div id="editor"></div>';
		window.__clientSideMediaProcessing = false;
		window.matchMedia = jest.fn( () => ( { matches: false } ) );
		setDefaults.mockClear();
		reapplyBlockTypeFilters.mockClear();
		setupEditor.mockClear();
		dispatch.mockImplementation( ( store ) => {
			if ( store === preferencesStore ) {
				return { setDefaults };
			}
			if ( store === blocksStore ) {
				return { reapplyBlockTypeFilters };
			}
			if ( store === editorStore ) {
				return { setupEditor };
			}
			return {};
		} );
		resolveSelect.mockReturnValue( asyncSelectors );
		select.mockImplementation( ( store ) => {
			if ( store === preferencesStore ) {
				return { get: () => false };
			}
			if ( store === coreDataStore ) {
				return coreDataSelectors;
			}
			return {};
		} );
	} );

	afterEach( () => {
		removeFilter( FILTER_NAME, FILTER_NAMESPACE );
	} );

	it( 'filters collaboration notification preference defaults', () => {
		const filter = jest.fn( ( defaults ) => ( {
			...defaults,
			showListViewByDefault: true,
			showCollaborationJoinNotifications: false,
		} ) );
		addFilter( FILTER_NAME, FILTER_NAMESPACE, filter );

		initializeEditor( 'editor', 'post', 1, { template: '' }, {} );

		expect( filter ).toHaveBeenCalledWith(
			expect.any( Object ),
			'core/edit-post'
		);
		expect( setDefaults ).toHaveBeenCalledWith(
			'core',
			expect.objectContaining( {
				showCollaborationJoinNotifications: false,
				showCollaborationLeaveNotifications: true,
				showCollaborationPostSaveNotifications: true,
				showListViewByDefault: false,
			} )
		);
	} );
} );
