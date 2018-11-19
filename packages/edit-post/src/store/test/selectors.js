/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	getEditorMode,
	getPreference,
	isEditorSidebarOpened,
	isEditorPanelOpened,
	isModalActive,
	isFeatureActive,
	isPluginSidebarOpened,
	getActiveGeneralSidebarName,
	isPluginItemPinned,
	hasMetaBoxes,
	isSavingMetaBoxes,
	getActiveMetaBoxLocations,
	isMetaBoxLocationActive,
	isEditorPanelEnabled,
	isEditorPanelRemoved,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getEditorMode', () => {
		it( 'should return the selected editor mode', () => {
			const state = {
				preferences: { editorMode: 'text' },
			};

			expect( getEditorMode( state ) ).toEqual( 'text' );
		} );

		it( 'should fallback to visual if not set', () => {
			const state = {
				preferences: {},
			};

			expect( getEditorMode( state ) ).toEqual( 'visual' );
		} );
	} );

	describe( 'getPreference', () => {
		it( 'should return the preference value if set', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return undefined if the preference is unset', () => {
			const state = {
				preferences: { chicken: true },
			};

			expect( getPreference( state, 'ribs' ) ).toBeUndefined();
		} );

		it( 'should return the default value if provided', () => {
			const state = {
				preferences: {},
			};

			expect( getPreference( state, 'ribs', 'chicken' ) ).toEqual( 'chicken' );
		} );
	} );

	describe( 'isEditorSidebarOpened', () => {
		it( 'should return false when the editor sidebar is not opened', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: true,
				},
				activeGeneralSidebar: null,
			};

			expect( isEditorSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return false when the editor sidebar is assigned but not opened', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: true,
				},
				activeGeneralSidebar: 'edit-post/document',
			};

			expect( isEditorSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return false when the plugin sidebar is opened', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: false,
				},
				activeGeneralSidebar: 'my-plugin/my-sidebar',
			};

			expect( isEditorSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return true when the editor sidebar is opened', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: false,
				},
				activeGeneralSidebar: 'edit-post/document',
			};

			expect( isEditorSidebarOpened( state ) ).toBe( true );
		} );
	} );

	describe( 'isPluginSidebarOpened', () => {
		it( 'should return false when the plugin sidebar is not opened', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: true,
				},
				activeGeneralSidebar: null,
			};

			expect( isPluginSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return false when the editor sidebar is opened', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: false,
				},
				activeGeneralSidebar: 'edit-post/document',
			};

			expect( isPluginSidebarOpened( state ) ).toBe( false );
		} );

		it( 'should return true when the plugin sidebar is opened', () => {
			const name = 'plugin-sidebar/my-plugin/my-sidebar';
			const state = {
				preferences: {
					isGeneralSidebarDismissed: false,
				},
				activeGeneralSidebar: name,
			};

			expect( isPluginSidebarOpened( state ) ).toBe( true );
		} );
	} );

	describe( 'getActiveGeneralSidebarName', () => {
		it( 'returns null if dismissed', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: true,
				},
				activeGeneralSidebar: 'edit-post/block',
			};

			expect( getActiveGeneralSidebarName( state ) ).toBe( null );
		} );

		it( 'returns active general sidebar', () => {
			const state = {
				preferences: {
					isGeneralSidebarDismissed: false,
				},
				activeGeneralSidebar: 'edit-post/block',
			};

			expect( getActiveGeneralSidebarName( state ) ).toBe( 'edit-post/block' );
		} );
	} );

	describe( 'isModalActive', () => {
		it( 'returns true if the provided name matches the value in the preferences activeModal property', () => {
			const state = {
				activeModal: 'test-modal',
			};

			expect( isModalActive( state, 'test-modal' ) ).toBe( true );
		} );

		it( 'returns false if the provided name does not match the preferences activeModal property', () => {
			const state = {
				activeModal: 'something-else',
			};

			expect( isModalActive( state, 'test-modal' ) ).toBe( false );
		} );

		it( 'returns false if the preferences activeModal property is null', () => {
			const state = {
				activeModal: null,
			};

			expect( isModalActive( state, 'test-modal' ) ).toBe( false );
		} );
	} );

	describe( 'isEditorPanelRemoved', () => {
		it( 'should return false by default', () => {
			const state = deepFreeze( {
				removedPanels: [],
			} );

			expect( isEditorPanelRemoved( state, 'post-status' ) ).toBe( false );
		} );

		it( 'should return true when panel was removed', () => {
			const state = deepFreeze( {
				removedPanels: [
					'post-status',
				],
			} );

			expect( isEditorPanelRemoved( state, 'post-status' ) ).toBe( true );
		} );
	} );

	describe( 'isEditorPanelEnabled', () => {
		it( 'should return true by default', () => {
			const state = {
				preferences: {
					panels: {},
				},
			};

			expect( isEditorPanelEnabled( state, 'post-status' ) ).toBe( true );
		} );

		it( 'should return true when a panel has been enabled', () => {
			const state = {
				preferences: {
					panels: {
						'post-status': { enabled: true },
					},
				},
			};

			expect( isEditorPanelEnabled( state, 'post-status' ) ).toBe( true );
		} );

		it( 'should return false when a panel has been disabled', () => {
			const state = {
				preferences: {
					panels: {
						'post-status': { enabled: false },
					},
				},
			};

			expect( isEditorPanelEnabled( state, 'post-status' ) ).toBe( false );
		} );

		it( 'should return false when a panel is enabled but removed', () => {
			const state = deepFreeze( {
				preferences: {
					panels: {
						'post-status': {
							enabled: true,
						},
					},
				},
				removedPanels: [ 'post-status' ],
			} );

			expect( isEditorPanelEnabled( state, 'post-status' ) ).toBe( false );
		} );
	} );

	describe( 'isEditorPanelOpened', () => {
		it( 'should return false by default', () => {
			const state = {
				preferences: {
					panels: {},
				},
			};

			expect( isEditorPanelOpened( state, 'post-status' ) ).toBe( false );
		} );

		it( 'should return true when a panel has been opened', () => {
			const state = {
				preferences: {
					panels: {
						'post-status': { opened: true },
					},
				},
			};

			expect( isEditorPanelOpened( state, 'post-status' ) ).toBe( true );
		} );

		it( 'should return false when a panel has been closed', () => {
			const state = {
				preferences: {
					panels: {
						'post-status': { opened: false },
					},
				},
			};

			expect( isEditorPanelOpened( state, 'post-status' ) ).toBe( false );
		} );

		it( 'should return true when a panel has been legacy opened', () => {
			const state = {
				preferences: {
					panels: {
						'post-status': true,
					},
				},
			};

			expect( isEditorPanelOpened( state, 'post-status' ) ).toBe( true );
		} );

		it( 'should return false when a panel has been legacy closed', () => {
			const state = {
				preferences: {
					panels: {
						'post-status': false,
					},
				},
			};

			expect( isEditorPanelOpened( state, 'post-status' ) ).toBe( false );
		} );
	} );

	describe( 'isFeatureActive', () => {
		it( 'should return true if feature is active', () => {
			const state = {
				preferences: {
					features: {
						chicken: true,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( true );
		} );

		it( 'should return false if feature is not active', () => {
			const state = {
				preferences: {
					features: {
						chicken: false,
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );

		it( 'should return false if feature is not referred', () => {
			const state = {
				preferences: {
					features: {
					},
				},
			};

			expect( isFeatureActive( state, 'chicken' ) ).toBe( false );
		} );
	} );

	describe( 'isPluginItemPinned', () => {
		const state = {
			preferences: {
				pinnedPluginItems: {
					'foo/pinned': true,
					'foo/unpinned': false,
				},
			},
		};

		it( 'should return true if the flag is not set for the plugin item', () => {
			expect( isPluginItemPinned( state, 'foo/unknown' ) ).toBe( true );
		} );

		it( 'should return true if plugin item is not pinned', () => {
			expect( isPluginItemPinned( state, 'foo/pinned' ) ).toBe( true );
		} );

		it( 'should return false if plugin item item is unpinned', () => {
			expect( isPluginItemPinned( state, 'foo/unpinned' ) ).toBe( false );
		} );
	} );

	describe( 'hasMetaBoxes', () => {
		it( 'should return true if there are active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
					},
				},
			};

			expect( hasMetaBoxes( state ) ).toBe( true );
		} );

		it( 'should return false if there are no active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [],
					},
				},
			};

			expect( hasMetaBoxes( state ) ).toBe( false );
		} );
	} );

	describe( 'isSavingMetaBoxes', () => {
		it( 'should return true if some meta boxes are saving', () => {
			const state = {
				metaBoxes: {
					isSaving: true,
					locations: {},
				},
			};

			expect( isSavingMetaBoxes( state ) ).toBe( true );
		} );

		it( 'should return false if no meta boxes are saving', () => {
			const state = {
				metaBoxes: {
					isSaving: false,
					locations: {},
				},
			};

			expect( isSavingMetaBoxes( state ) ).toBe( false );
		} );
	} );

	describe( 'getActiveMetaBoxLocations', () => {
		it( 'should return the active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
						normal: [],
					},
				},
			};

			const result = getActiveMetaBoxLocations( state, 'side' );

			expect( result ).toEqual( [ 'side' ] );
		} );
	} );

	describe( 'isMetaBoxLocationActive', () => {
		it( 'should return false if not active', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [],
					},
				},
			};

			const result = isMetaBoxLocationActive( state, 'side' );

			expect( result ).toBe( false );
		} );

		it( 'should return true if active', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
					},
				},
			};

			const result = isMetaBoxLocationActive( state, 'side' );

			expect( result ).toBe( true );
		} );
	} );
} );
