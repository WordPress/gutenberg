/**
 * Internal dependencies
 */
import {
	setGeneralSidebarActivePanel,
	toggleGeneralSidebarEditorPanel,
	openGeneralSidebar,
	closeGeneralSidebar,
	openPublishSidebar,
	closePublishSidebar,
	togglePublishSidebar,
	toggleFeature,
	requestMetaBoxUpdates,
	initializeMetaBoxState,
} from '../actions';

describe( 'actions', () => {
	describe( 'setGeneralSidebarActivePanel', () => {
		it( 'should return SET_GENERAL_SIDEBAR_ACTIVE_PANEL action', () => {
			expect( setGeneralSidebarActivePanel( 'editor', 'document' ) ).toEqual( {
				type: 'SET_GENERAL_SIDEBAR_ACTIVE_PANEL',
				sidebar: 'editor',
				panel: 'document',
			} );
		} );
	} );

	describe( 'openGeneralSidebar', () => {
		it( 'should return OPEN_GENERAL_SIDEBAR action', () => {
			const sidebar = 'sidebarName';
			const panel = 'panelName';
			expect( openGeneralSidebar( sidebar, panel ) ).toEqual( {
				type: 'OPEN_GENERAL_SIDEBAR',
				sidebar,
				panel,
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

	describe( 'toggleSidebarPanel', () => {
		it( 'should return TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL action', () => {
			const panel = 'panelName';
			expect( toggleGeneralSidebarEditorPanel( panel ) ).toEqual( {
				type: 'TOGGLE_GENERAL_SIDEBAR_EDITOR_PANEL',
				panel,
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

	describe( 'requestMetaBoxUpdates', () => {
		it( 'should return the REQUEST_META_BOX_UPDATES action', () => {
			expect( requestMetaBoxUpdates() ).toEqual( {
				type: 'REQUEST_META_BOX_UPDATES',
			} );
		} );
	} );

	describe( 'initializeMetaBoxState', () => {
		it( 'should return the META_BOX_STATE_CHANGED action with a hasChanged flag', () => {
			const metaBoxes = {
				side: true,
				normal: true,
				advanced: false,
			};

			expect( initializeMetaBoxState( metaBoxes ) ).toEqual( {
				type: 'INITIALIZE_META_BOX_STATE',
				metaBoxes,
			} );
		} );
	} );
} );
