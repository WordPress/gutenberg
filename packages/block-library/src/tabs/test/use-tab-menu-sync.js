/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'core/block-editor' },
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attributes ) => ( {
		name,
		attributes,
		// Deterministic clientId so tests can assert on it.
		clientId: `generated:${ name }:${ attributes.anchor ?? '' }`,
		innerBlocks: [],
	} ) ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
} ) );

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useTabMenuSync from '../use-tab-menu-sync';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTab( clientId, anchor, label = '' ) {
	return { clientId, attributes: { anchor, label } };
}

function makeMenuItem( clientId, anchor ) {
	return { clientId, anchor };
}

const PANEL = 'panel-client-id';
const MENU = 'menu-client-id';

function renderSync( initialProps ) {
	return renderHook(
		( { tabs, menuItems, tabPanelClientId, tabsMenuClientId } ) =>
			useTabMenuSync( {
				tabs,
				menuItems,
				tabPanelClientId,
				tabsMenuClientId,
			} ),
		{ initialProps }
	);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let removeBlock;
let insertBlock;
let updateBlockAttributes;

beforeEach( () => {
	removeBlock = jest.fn();
	insertBlock = jest.fn();
	updateBlockAttributes = jest.fn();

	useDispatch.mockReturnValue( {
		removeBlock,
		insertBlock,
		updateBlockAttributes,
	} );

	createBlock.mockImplementation( ( name, attributes ) => ( {
		name,
		attributes,
		clientId: `generated:${ name }:${ attributes.anchor ?? '' }`,
		innerBlocks: [],
	} ) );
} );

afterEach( () => {
	jest.clearAllMocks();
} );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe( 'useTabMenuSync', () => {
	describe( 'initial mount', () => {
		it( 'does nothing on first render', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).not.toHaveBeenCalled();
			expect( insertBlock ).not.toHaveBeenCalled();
			expect( updateBlockAttributes ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when re-rendered with the same data', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];
			const props = {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			};

			const { rerender } = renderSync( props );
			rerender( props );

			expect( removeBlock ).not.toHaveBeenCalled();
			expect( insertBlock ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'deletion', () => {
		it( 'removes the menu item when a tab is deleted', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			rerender( {
				tabs: [ makeTab( 't1', 'tab-1', 'Tab 1' ) ],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).toHaveBeenCalledTimes( 1 );
			expect( removeBlock ).toHaveBeenCalledWith( 'm2', false );
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'removes the tab when a menu item is deleted', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			rerender( {
				tabs,
				menuItems: [ makeMenuItem( 'm1', 'tab-1-button' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).toHaveBeenCalledTimes( 1 );
			expect( removeBlock ).toHaveBeenCalledWith( 't2', false );
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when both sides shrink simultaneously (toolbar removal)', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Both lists shrink together — already in sync.
			rerender( {
				tabs: [ makeTab( 't1', 'tab-1', 'Tab 1' ) ],
				menuItems: [ makeMenuItem( 'm1', 'tab-1-button' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).not.toHaveBeenCalled();
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when both sides grow by different amounts', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Tabs grew by 2, menu items grew by 1.
			// Bail out.
			rerender( {
				tabs: [
					...tabs,
					makeTab( 't3', 'tab-3', 'Tab 3' ),
					makeTab( 't4', 'tab-4', 'Tab 4' ),
				],
				menuItems: [
					...menuItems,
					makeMenuItem( 'm3', 'tab-3-button' ),
				],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
			expect( removeBlock ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'tab inserted', () => {
		it( 'inserts a menu item when a tab with a fresh anchor is pasted', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// New tab 't3' has anchor 'tab-3' — no conflict.
			rerender( {
				tabs: [ ...tabs, makeTab( 't3', 'tab-3', 'Tab 3' ) ],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( updateBlockAttributes ).not.toHaveBeenCalled();
			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					attributes: { anchor: 'tab-3-button' },
				} ),
				2, // index of the new tab
				MENU,
				false
			);
		} );

		it( 'generates a fresh anchor and updates the tab when a duplicate tab conflicts', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// 't1-dup' is a duplicate of t1, keeping its anchor 'tab-1'.
			const dupTab = makeTab( 't1-dup', 'tab-1', 'Tab 1' );
			rerender( {
				tabs: [
					makeTab( 't1', 'tab-1', 'Tab 1' ),
					dupTab,
					makeTab( 't2', 'tab-2', 'Tab 2' ),
				],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Anchor on the duplicate tab must be updated to avoid conflict.
			expect( updateBlockAttributes ).toHaveBeenCalledWith( 't1-dup', {
				anchor: 'tab-4', // currentTabs.length(3) + 1 = 4
			} );

			// A menu item with the new anchor should be inserted at index 1.
			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					attributes: { anchor: 'tab-4-button' },
				} ),
				1,
				MENU,
				false
			);
		} );

		it( 'does nothing when tabs-menu clientId is missing', () => {
			const tabs = [ makeTab( 't1', 'tab-1', 'Tab 1' ) ];
			const menuItems = [];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: null,
			} );

			rerender( {
				tabs: [ ...tabs, makeTab( 't2', 'tab-2', 'Tab 2' ) ],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: null,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'syncs once (no duplicates) when tabs-menu clientId becomes available after a one-sided insertion', () => {
			const tabs = [ makeTab( 't1', 'tab-1', 'Tab 1' ) ];
			const menuItems = [ makeMenuItem( 'm1', 'tab-1-button' ) ];
			const tabsWithNew = [ ...tabs, makeTab( 't2', 'tab-2', 'Tab 2' ) ];

			// Render 1 — initial snapshot.
			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: null,
			} );

			// Render 2 — tab inserted but container unavailable; snapshot must NOT advance.
			rerender( {
				tabs: tabsWithNew,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: null,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();

			// Render 3 — container now available; hook should sync exactly once.
			rerender( {
				tabs: tabsWithNew,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					attributes: { anchor: 'tab-2-button' },
				} ),
				1,
				MENU,
				false
			);

			// Render 4 — same props; no further insertions.
			rerender( {
				tabs: tabsWithNew,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does nothing when both sides grow simultaneously (Add Tab toolbar)', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Both grow together — "Add Tab" already created both.
			rerender( {
				tabs: [ ...tabs, makeTab( 't3', 'tab-3', 'Tab 3' ) ],
				menuItems: [
					...menuItems,
					makeMenuItem( 'm3', 'tab-3-button' ),
				],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
			expect( removeBlock ).not.toHaveBeenCalled();
		} );

		it( 'generates distinct anchors when two tabs are duplicated at once', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Two duplicates inserted — both keep conflicting anchor 'tab-1'.
			const dup1 = makeTab( 'dup-a', 'tab-1', 'Tab 1' );
			const dup2 = makeTab( 'dup-b', 'tab-1', 'Tab 1' );
			rerender( {
				tabs: [
					makeTab( 't1', 'tab-1', 'Tab 1' ),
					dup1,
					dup2,
					makeTab( 't2', 'tab-2', 'Tab 2' ),
				],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			const assignedAnchors = updateBlockAttributes.mock.calls.map(
				( [ , attrs ] ) => attrs.anchor
			);
			expect( assignedAnchors ).toHaveLength( 2 );
			// Each duplicate must receive a distinct anchor.
			expect( new Set( assignedAnchors ).size ).toBe( 2 );
			// Both must be distinct from the originals.
			expect( assignedAnchors ).not.toContain( 'tab-1' );
			expect( assignedAnchors ).not.toContain( 'tab-2' );
		} );
	} );

	describe( 'menu item inserted', () => {
		it( 'inserts a tab when a menu item with a fresh anchor is pasted', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// New menu item 'm3' has anchor 'tab-3-button' — no conflict.
			rerender( {
				tabs,
				menuItems: [
					...menuItems,
					makeMenuItem( 'm3', 'tab-3-button' ),
				],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( updateBlockAttributes ).not.toHaveBeenCalled();
			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					attributes: { anchor: 'tab-3', label: '' },
				} ),
				2, // index of the new menu item
				PANEL,
				false
			);
		} );

		it( 'generates a fresh anchor and copies the label when a menu item is duplicated', () => {
			const tabs = [
				makeTab( 't1', 'tab-1', 'Tab 1' ),
				makeTab( 't2', 'tab-2', 'Tab 2' ),
			];
			const menuItems = [
				makeMenuItem( 'm1', 'tab-1-button' ),
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// 'm1-dup' is a duplicate of m1, keeping its anchor 'tab-1-button'.
			const dupItem = makeMenuItem( 'm1-dup', 'tab-1-button' );
			rerender( {
				tabs,
				menuItems: [
					makeMenuItem( 'm1', 'tab-1-button' ),
					dupItem,
					makeMenuItem( 'm2', 'tab-2-button' ),
				],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Anchor on the duplicate menu item must be updated.
			expect( updateBlockAttributes ).toHaveBeenCalledWith( 'm1-dup', {
				anchor: 'tab-4-button', // menuItems.length(3) + 1 = 4
			} );

			// A tab with the new base anchor and the original label should be inserted.
			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					attributes: { anchor: 'tab-4', label: 'Tab 1' },
				} ),
				1, // index of the duplicate in the menu items list
				PANEL,
				false
			);
		} );

		it( 'does nothing when tab-panel clientId is missing', () => {
			const tabs = [ makeTab( 't1', 'tab-1', 'Tab 1' ) ];
			const menuItems = [ makeMenuItem( 'm1', 'tab-1-button' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			rerender( {
				tabs,
				menuItems: [
					...menuItems,
					makeMenuItem( 'm2', 'tab-2-button' ),
				],
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'syncs once (no duplicates) when tab-panel clientId becomes available after a one-sided insertion', () => {
			const tabs = [ makeTab( 't1', 'tab-1', 'Tab 1' ) ];
			const menuItems = [ makeMenuItem( 'm1', 'tab-1-button' ) ];
			const menuItemsWithNew = [
				...menuItems,
				makeMenuItem( 'm2', 'tab-2-button' ),
			];

			// Render 1 — initial snapshot.
			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			// Render 2 — menu item inserted but container unavailable; snapshot must NOT advance.
			rerender( {
				tabs,
				menuItems: menuItemsWithNew,
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();

			// Render 3 — container now available; hook should sync exactly once.
			rerender( {
				tabs,
				menuItems: menuItemsWithNew,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					attributes: { anchor: 'tab-2', label: '' },
				} ),
				1,
				PANEL,
				false
			);

			// Render 4 — same props; no further insertions.
			rerender( {
				tabs,
				menuItems: menuItemsWithNew,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
