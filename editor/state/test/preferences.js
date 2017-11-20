/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import reducer, {
	getPreference,
	isEditorSidebarOpened,
	isEditorSidebarPanelOpened,
	getMostFrequentlyUsedBlocks,
	getRecentlyUsedBlocks,
	getEditorMode,
} from '../preferences';

describe( 'preferences', () => {
	describe( 'reducer', () => {
		it( 'should apply all defaults', () => {
			const state = reducer( undefined, {} );

			expect( state ).toEqual( {
				blockUsage: {},
				recentlyUsedBlocks: [],
				mode: 'visual',
				isSidebarOpened: true,
				panels: { 'post-status': true },
				features: { fixedToolbar: true },
			} );
		} );

		it( 'should toggle the sidebar open flag', () => {
			const state = reducer( deepFreeze( { isSidebarOpened: false } ), {
				type: 'TOGGLE_SIDEBAR',
			} );

			expect( state ).toEqual( { isSidebarOpened: true } );
		} );

		it( 'should set the sidebar panel open flag to true if unset', () => {
			const state = reducer( deepFreeze( { isSidebarOpened: false } ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, panels: { 'post-taxonomies': true } } );
		} );

		it( 'should toggle the sidebar panel open flag', () => {
			const state = reducer( deepFreeze( { isSidebarOpened: false, panels: { 'post-taxonomies': true } } ), {
				type: 'TOGGLE_SIDEBAR_PANEL',
				panel: 'post-taxonomies',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, panels: { 'post-taxonomies': false } } );
		} );

		it( 'should return switched mode', () => {
			const state = reducer( deepFreeze( { isSidebarOpened: false } ), {
				type: 'SWITCH_MODE',
				mode: 'text',
			} );

			expect( state ).toEqual( { isSidebarOpened: false, mode: 'text' } );
		} );

		it( 'should record recently used blocks', () => {
			const state = reducer( deepFreeze( { recentlyUsedBlocks: [], blockUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'bacon',
					name: 'core-embed/twitter',
				} ],
			} );

			expect( state.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/twitter' );

			const twoRecentBlocks = reducer( deepFreeze( { recentlyUsedBlocks: [], blockUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'eggs',
					name: 'core-embed/twitter',
				}, {
					uid: 'bacon',
					name: 'core-embed/youtube',
				} ],
			} );

			expect( twoRecentBlocks.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/youtube' );
			expect( twoRecentBlocks.recentlyUsedBlocks[ 1 ] ).toEqual( 'core-embed/twitter' );
		} );

		it( 'should record block usage', () => {
			const state = reducer( deepFreeze( { recentlyUsedBlocks: [], blockUsage: {} } ), {
				type: 'INSERT_BLOCKS',
				blocks: [ {
					uid: 'eggs',
					name: 'core-embed/twitter',
				}, {
					uid: 'bacon',
					name: 'core-embed/youtube',
				}, {
					uid: 'milk',
					name: 'core-embed/youtube',
				} ],
			} );

			expect( state.blockUsage ).toEqual( { 'core-embed/youtube': 2, 'core-embed/twitter': 1 } );
		} );

		it( 'should populate recentlyUsedBlocks, filling up with common blocks, on editor setup', () => {
			const state = reducer( deepFreeze( { recentlyUsedBlocks: [ 'core-embed/twitter', 'core-embed/youtube' ] } ), {
				type: 'SETUP_EDITOR',
			} );

			expect( state.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/twitter' );
			expect( state.recentlyUsedBlocks[ 1 ] ).toEqual( 'core-embed/youtube' );

			state.recentlyUsedBlocks.slice( 2 ).forEach(
				block => expect( getBlockType( block ).category ).toEqual( 'common' )
			);
			expect( state.recentlyUsedBlocks ).toHaveLength( 8 );
		} );

		it( 'should remove unregistered blocks from persisted recent usage', () => {
			const state = reducer( deepFreeze( { recentlyUsedBlocks: [ 'core-embed/i-do-not-exist', 'core-embed/youtube' ] } ), {
				type: 'SETUP_EDITOR',
			} );
			expect( state.recentlyUsedBlocks[ 0 ] ).toEqual( 'core-embed/youtube' );
		} );

		it( 'should remove unregistered blocks from persisted block usage stats', () => {
			const state = reducer( deepFreeze( { recentlyUsedBlocks: [], blockUsage: { 'core/i-do-not-exist': 42, 'core-embed/youtube': 88 } } ), {
				type: 'SETUP_EDITOR',
			} );
			expect( state.blockUsage ).toEqual( { 'core-embed/youtube': 88 } );
		} );

		it( 'should toggle a feature flag', () => {
			const state = reducer( deepFreeze( { features: { chicken: true } } ), {
				type: 'TOGGLE_FEATURE',
				feature: 'chicken',
			} );
			expect( state ).toEqual( { features: { chicken: false } } );
		} );
	} );

	describe( 'selectors', () => {
		beforeEach( () => {
			getMostFrequentlyUsedBlocks.clear();
		} );

		describe( 'getPreference()', () => {
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
			it( 'should return true when the sidebar is opened', () => {
				const state = {
					preferences: { isSidebarOpened: true },
				};

				expect( isEditorSidebarOpened( state ) ).toBe( true );
			} );

			it( 'should return false when the sidebar is opened', () => {
				const state = {
					preferences: { isSidebarOpened: false },
				};

				expect( isEditorSidebarOpened( state ) ).toBe( false );
			} );
		} );

		describe( 'isEditorSidebarPanelOpened', () => {
			it( 'should return false if no panels preference', () => {
				const state = {
					preferences: { isSidebarOpened: true },
				};

				expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
			} );

			it( 'should return false if the panel value is not set', () => {
				const state = {
					preferences: { panels: {} },
				};

				expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( false );
			} );

			it( 'should return the panel value', () => {
				const state = {
					preferences: { panels: { 'post-taxonomies': true } },
				};

				expect( isEditorSidebarPanelOpened( state, 'post-taxonomies' ) ).toBe( true );
			} );
		} );

		describe( 'getMostFrequentlyUsedBlocks', () => {
			it( 'should have paragraph and image to bring frequently used blocks up to three blocks', () => {
				const noUsage = { preferences: { blockUsage: {} } };
				const someUsage = { preferences: { blockUsage: { 'core/paragraph': 1 } } };

				expect( getMostFrequentlyUsedBlocks( noUsage ).map( ( block ) => block.name ) )
					.toEqual( [ 'core/paragraph', 'core/image' ] );

				expect( getMostFrequentlyUsedBlocks( someUsage ).map( ( block ) => block.name ) )
					.toEqual( [ 'core/paragraph', 'core/image' ] );
			} );
			it( 'should return the top 3 most recently used blocks', () => {
				const state = {
					preferences: {
						blockUsage: {
							'core/deleted-block': 20,
							'core/paragraph': 4,
							'core/image': 11,
							'core/quote': 2,
							'core/gallery': 1,
						},
					},
				};

				expect( getMostFrequentlyUsedBlocks( state ).map( ( block ) => block.name ) )
					.toEqual( [ 'core/image', 'core/paragraph', 'core/quote' ] );
			} );
		} );

		describe( 'getRecentlyUsedBlocks', () => {
			it( 'should return the most recently used blocks', () => {
				const state = {
					preferences: {
						recentlyUsedBlocks: [ 'core/deleted-block', 'core/paragraph', 'core/image' ],
					},
				};

				expect( getRecentlyUsedBlocks( state ).map( ( block ) => block.name ) )
					.toEqual( [ 'core/paragraph', 'core/image' ] );
			} );
		} );

		describe( 'getEditorMode', () => {
			it( 'should return the selected editor mode', () => {
				const state = {
					preferences: { mode: 'text' },
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
	} );
} );
