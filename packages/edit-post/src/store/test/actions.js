/**
 * Internal dependencies
 */
import {
	toggleEditorPanelEnabled,
	toggleEditorPanelOpened,
	removeEditorPanel,
	openGeneralSidebar,
	closeGeneralSidebar,
	openPublishSidebar,
	closePublishSidebar,
	togglePublishSidebar,
	openModal,
	closeModal,
	toggleFeature,
	togglePinnedPluginItem,
	requestMetaBoxUpdates,
	__unstableInitialize,
} from '../actions';
import { VIEW_AS_LINK_SELECTOR } from '../constants';

describe( 'actions', () => {
	describe( 'openGeneralSidebar', () => {
		it( 'should return OPEN_GENERAL_SIDEBAR action', () => {
			const name = 'plugin/my-name';
			expect( openGeneralSidebar( name ) ).toEqual( {
				type: 'OPEN_GENERAL_SIDEBAR',
				name,
			} );
		} );
	} );

	describe( 'closeGeneralSidebar', () => {
		it( 'should return CLOSE_GENERAL_SIDEBAR action', () => {
			expect( closeGeneralSidebar() ).toEqual( {
				type: 'CLOSE_GENERAL_SIDEBAR',
			} );
		} );
	} );

	describe( 'openPublishSidebar', () => {
		it( 'should return an OPEN_PUBLISH_SIDEBAR action', () => {
			expect( openPublishSidebar() ).toEqual( {
				type: 'OPEN_PUBLISH_SIDEBAR',
			} );
		} );
	} );

	describe( 'closePublishSidebar', () => {
		it( 'should return an CLOSE_PUBLISH_SIDEBAR action', () => {
			expect( closePublishSidebar() ).toEqual( {
				type: 'CLOSE_PUBLISH_SIDEBAR',
			} );
		} );
	} );

	describe( 'togglePublishSidebar', () => {
		it( 'should return an TOGGLE_PUBLISH_SIDEBAR action', () => {
			expect( togglePublishSidebar() ).toEqual( {
				type: 'TOGGLE_PUBLISH_SIDEBAR',
			} );
		} );
	} );

	describe( 'removeEditorPanel', () => {
		it( 'should return a REMOVE_PANEL action', () => {
			expect( removeEditorPanel( 'post-status' ) ).toEqual( {
				type: 'REMOVE_PANEL',
				panelName: 'post-status',
			} );
		} );
	} );

	describe( 'toggleEditorPanelEnabled', () => {
		it( 'should return a TOGGLE_PANEL_ENABLED action', () => {
			expect( toggleEditorPanelEnabled( 'post-status' ) ).toEqual( {
				type: 'TOGGLE_PANEL_ENABLED',
				panelName: 'post-status',
			} );
		} );
	} );

	describe( 'toggleEditorPanelOpened', () => {
		it( 'should return a TOGGLE_PANEL_OPENED action', () => {
			expect( toggleEditorPanelOpened( 'post-status' ) ).toEqual( {
				type: 'TOGGLE_PANEL_OPENED',
				panelName: 'post-status',
			} );
		} );
	} );

	describe( 'openModal', () => {
		it( 'should return OPEN_MODAL action', () => {
			const name = 'plugin/my-name';
			expect( openModal( name ) ).toEqual( {
				type: 'OPEN_MODAL',
				name,
			} );
		} );
	} );

	describe( 'closeModal', () => {
		it( 'should return CLOSE_MODAL action', () => {
			expect( closeModal() ).toEqual( {
				type: 'CLOSE_MODAL',
			} );
		} );
	} );

	describe( 'toggleFeature', () => {
		it( 'should return TOGGLE_FEATURE action', () => {
			const feature = 'name';
			expect( toggleFeature( feature ) ).toEqual( {
				type: 'TOGGLE_FEATURE',
				feature,
			} );
		} );
	} );

	describe( 'togglePinnedPluginItem', () => {
		it( 'should return TOGGLE_PINNED_PLUGIN_ITEM action', () => {
			const pluginName = 'foo/bar';

			expect( togglePinnedPluginItem( pluginName ) ).toEqual( {
				type: 'TOGGLE_PINNED_PLUGIN_ITEM',
				pluginName,
			} );
		} );
	} );

	describe( 'requestMetaBoxUpdates', () => {
		it( 'should return the REQUEST_META_BOX_UPDATES action', () => {
			expect( requestMetaBoxUpdates() ).toEqual( {
				type: 'REQUEST_META_BOX_UPDATES',
			} );
		} );
	} );

	describe( '__unstableInitialize', () => {
		let fulfillment;
		const reset = () => fulfillment = __unstableInitialize();
		const registryMock = { select: {}, dispatch: {} };
		describe( 'yields subscribe control descriptor for block settings', () => {
			reset();
			const { value } = fulfillment.next();
			const listenerCallback = value.listenerCallback;
			const isEditorSidebarOpened = jest.fn();
			const	getBlockSelectionStart = jest.fn();
			const	openSidebar = jest.fn();
			beforeEach( () => {
				registryMock.select = ( store ) => {
					const stores = {
						'core/block-editor': { getBlockSelectionStart },
						'core/edit-post': { isEditorSidebarOpened },
					};
					return stores[ store ];
				};
				registryMock.dispatch = () => ( { openGeneralSidebar: openSidebar } );
			} );
			afterEach( () => {
				isEditorSidebarOpened.mockClear();
				getBlockSelectionStart.mockClear();
				openSidebar.mockClear();
			} );
			it( 'returns subscribe control descriptor', () => {
				expect( value.type ).toBe( 'SUBSCRIBE' );
			} );
			it( 'does nothing if sidebar is not opened', () => {
				getBlockSelectionStart.mockReturnValue( true );
				isEditorSidebarOpened.mockReturnValue( false );
				const listener = listenerCallback( registryMock );
				getBlockSelectionStart.mockReturnValue( false );
				listener();
				expect( getBlockSelectionStart ).toHaveBeenCalled();
				expect( isEditorSidebarOpened ).toHaveBeenCalled();
				expect( openSidebar ).not.toHaveBeenCalled();
			} );
			it( 'opens block sidebar if block is selected', () => {
				isEditorSidebarOpened.mockReturnValue( true );
				getBlockSelectionStart.mockReturnValue( false );
				const listener = listenerCallback( registryMock );
				getBlockSelectionStart.mockReturnValue( true );
				listener();
				expect( openSidebar ).toHaveBeenCalledWith( 'edit-post/block' );
			} );
			it( 'opens document sidebar if block is not selected', () => {
				isEditorSidebarOpened.mockReturnValue( true );
				getBlockSelectionStart.mockReturnValue( true );
				const listener = listenerCallback( registryMock );
				getBlockSelectionStart.mockReturnValue( false );
				listener();
				expect( openSidebar ).toHaveBeenCalledWith( 'edit-post/document' );
			} );
		} );
		// testing of this control is done in in test/controls.js
		it( 'yields adjustSidebar control descriptor for adjusting the ' +
			'sidebar', () => {
			reset();
			fulfillment.next();
			const { value } = fulfillment.next();
			expect( value ).toEqual( { type: 'ADJUST_SIDEBAR' } );
		} );
		describe( 'yields subscribe control descriptor for updating the ' +
			'view post link when the permalink changes', () => {
			reset();
			fulfillment.next();
			fulfillment.next();
			const { value } = fulfillment.next();
			const listenerCallback = value.listenerCallback;
			const getCurrentPost = jest.fn();
			const setAttribute = jest.fn();
			beforeEach( () => {
				document.querySelector = jest.fn().mockReturnValue( { setAttribute } );
				getCurrentPost.mockReturnValue( { link: 'foo' } );
				registryMock.select = ( store ) => {
					const stores = { 'core/editor': { getCurrentPost } };
					return stores[ store ];
				};
			} );
			afterEach( () => {
				setAttribute.mockClear();
				getCurrentPost.mockClear();
			} );
			it( 'returns expected control descriptor', () => {
				expect( value.type ).toBe( 'SUBSCRIBE' );
			} );
			it( 'updates nothing if there is no new permalink', () => {
				const listener = listenerCallback( registryMock );
				listener();
				expect( getCurrentPost ).toHaveBeenCalledTimes( 2 );
				expect( document.querySelector ).not.toHaveBeenCalled();
				expect( setAttribute ).not.toHaveBeenCalled();
			} );
			it( 'does not do anything if the node is not found', () => {
				const listener = listenerCallback( registryMock );
				getCurrentPost.mockReturnValue( { link: 'bar' } );
				document.querySelector.mockReturnValue( false );
				listener();
				expect( document.querySelector )
					.toHaveBeenCalledWith( VIEW_AS_LINK_SELECTOR );
				expect( setAttribute ).not.toHaveBeenCalled();
			} );
			it( 'updates with the new permalink when node is found', () => {
				const listener = listenerCallback( registryMock );
				getCurrentPost.mockReturnValue( { link: 'bar' } );
				listener();
				expect( setAttribute ).toHaveBeenCalledWith( 'href', 'bar' );
			} );
		} );
	} );
} );
