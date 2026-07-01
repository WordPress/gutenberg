/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';
import { dispatch } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../store';
import { initializeEditor } from '../';

const FILTER_NAME = 'editor.CollaborationNotificationPreferenceDefaults';
const FILTER_NAMESPACE = 'test/collaboration-notification-defaults';

const setDefaults = jest.fn();
const reapplyBlockTypeFilters = jest.fn();
const setFreeformFallbackBlockName = jest.fn();
const updateSettings = jest.fn();

jest.mock( '@wordpress/blocks', () => ( {
	store: 'core/blocks',
} ) );
jest.mock( '@wordpress/block-library', () => ( {
	registerCoreBlocks: jest.fn(),
	__experimentalGetCoreBlocks: jest.fn( () => [] ),
	__experimentalRegisterExperimentalCoreBlocks: jest.fn(),
} ) );
jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
} ) );
jest.mock( '@wordpress/deprecated', () => jest.fn() );
jest.mock( '@wordpress/element', () => ( {
	createRoot: jest.fn( () => ( { render: jest.fn() } ) ),
	StrictMode: ( { children } ) => children,
} ) );
jest.mock( '@wordpress/editor', () => ( {
	privateApis: {},
} ) );
jest.mock( '@wordpress/preferences', () => ( {
	store: 'core/preferences',
} ) );
jest.mock( '@wordpress/widgets', () => ( {
	registerLegacyWidgetBlock: jest.fn(),
	registerWidgetGroupBlock: jest.fn(),
} ) );
jest.mock( '../components/app', () => () => null );
jest.mock( '../components/plugin-template-setting-panel', () => () => null );
jest.mock( '../lock-unlock', () => ( {
	unlock: () => ( {
		registerCoreBlockBindingsSources: jest.fn(),
	} ),
} ) );
jest.mock( '../store', () => ( {
	store: 'core/edit-site',
} ) );

describe( 'initializeEditor', () => {
	beforeEach( () => {
		document.body.innerHTML = '<div id="editor"></div>';
		window.__clientSideMediaProcessing = false;
		setDefaults.mockClear();
		reapplyBlockTypeFilters.mockClear();
		setFreeformFallbackBlockName.mockClear();
		updateSettings.mockClear();
		dispatch.mockImplementation( ( store ) => {
			if ( store === preferencesStore ) {
				return { setDefaults };
			}
			if ( store === blocksStore ) {
				return {
					reapplyBlockTypeFilters,
					setFreeformFallbackBlockName,
				};
			}
			if ( store === editSiteStore ) {
				return { updateSettings };
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
			fixedToolbar: true,
			showCollaborationLeaveNotifications: false,
			showCollaborationPostSaveNotifications: false,
		} ) );
		addFilter( FILTER_NAME, FILTER_NAMESPACE, filter );

		initializeEditor( 'editor', {} );

		expect( filter ).toHaveBeenCalledWith(
			expect.any( Object ),
			'core/edit-site'
		);
		expect( setDefaults ).toHaveBeenCalledWith(
			'core',
			expect.objectContaining( {
				showCollaborationJoinNotifications: true,
				showCollaborationLeaveNotifications: false,
				showCollaborationPostSaveNotifications: false,
				fixedToolbar: false,
			} )
		);
	} );
} );
