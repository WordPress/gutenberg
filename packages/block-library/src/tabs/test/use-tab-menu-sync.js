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
		clientId: `generated:${ name }`,
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

function makeTab( clientId, label = '' ) {
	return { clientId, attributes: { label } };
}

function makeMenuItem( clientId ) {
	return { clientId };
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
let replaceInnerBlocks;
let __unstableMarkNextChangeAsNotPersistent;

beforeEach( () => {
	removeBlock = jest.fn();
	insertBlock = jest.fn();
	replaceInnerBlocks = jest.fn();
	__unstableMarkNextChangeAsNotPersistent = jest.fn();

	useDispatch.mockReturnValue( {
		removeBlock,
		insertBlock,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} );

	createBlock.mockImplementation( ( name, attributes ) => ( {
		name,
		attributes,
		clientId: `generated:${ name }`,
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
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).not.toHaveBeenCalled();
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when re-rendered with the same data', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];
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
		it( 'removes the menu item at the same position when a tab is deleted', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Tab at index 1 ('t2') is deleted.
			rerender( {
				tabs: [ makeTab( 't1', 'Tab 1' ) ],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).toHaveBeenCalledTimes( 1 );
			expect( removeBlock ).toHaveBeenCalledWith( 'm2', false );
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'removes the tab at the same position when a menu item is deleted', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Menu item at index 1 ('m2') is deleted.
			rerender( {
				tabs,
				menuItems: [ makeMenuItem( 'm1' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).toHaveBeenCalledTimes( 1 );
			expect( removeBlock ).toHaveBeenCalledWith( 't2', false );
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'removes all orphaned menu items when multiple tabs are deleted at once', () => {
			const tabs = [
				makeTab( 't1', 'Tab 1' ),
				makeTab( 't2', 'Tab 2' ),
				makeTab( 't3', 'Tab 3' ),
			];
			const menuItems = [
				makeMenuItem( 'm1' ),
				makeMenuItem( 'm2' ),
				makeMenuItem( 'm3' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Tabs at index 0 and 1 ('t1', 't2') are deleted simultaneously.
			rerender( {
				tabs: [ makeTab( 't3', 'Tab 3' ) ],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).toHaveBeenCalledTimes( 2 );
			expect( removeBlock ).toHaveBeenCalledWith( 'm1', false );
			expect( removeBlock ).toHaveBeenCalledWith( 'm2', false );
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'removes all orphaned tabs when multiple menu items are deleted at once', () => {
			const tabs = [
				makeTab( 't1', 'Tab 1' ),
				makeTab( 't2', 'Tab 2' ),
				makeTab( 't3', 'Tab 3' ),
			];
			const menuItems = [
				makeMenuItem( 'm1' ),
				makeMenuItem( 'm2' ),
				makeMenuItem( 'm3' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Menu items at index 0 and 1 ('m1', 'm2') are deleted simultaneously.
			rerender( {
				tabs,
				menuItems: [ makeMenuItem( 'm3' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).toHaveBeenCalledTimes( 2 );
			expect( removeBlock ).toHaveBeenCalledWith( 't1', false );
			expect( removeBlock ).toHaveBeenCalledWith( 't2', false );
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when both sides shrink simultaneously (toolbar removal)', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Both lists shrink together — already in sync.
			rerender( {
				tabs: [ makeTab( 't1', 'Tab 1' ) ],
				menuItems: [ makeMenuItem( 'm1' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( removeBlock ).not.toHaveBeenCalled();
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when both sides grow by different amounts', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

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
					makeTab( 't3', 'Tab 3' ),
					makeTab( 't4', 'Tab 4' ),
				],
				menuItems: [ ...menuItems, makeMenuItem( 'm3' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
			expect( removeBlock ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'reordering', () => {
		it( 'reorders tabs to match when menu items are dragged to a new position', () => {
			const t1 = makeTab( 't1', 'Tab 1' );
			const t2 = makeTab( 't2', 'Tab 2' );
			const t3 = makeTab( 't3', 'Tab 3' );
			const tabs = [ t1, t2, t3 ];
			const menuItems = [
				makeMenuItem( 'm1' ),
				makeMenuItem( 'm2' ),
				makeMenuItem( 'm3' ),
			];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// User drags m1 to the end: new order is m2, m3, m1.
			rerender( {
				tabs,
				menuItems: [
					makeMenuItem( 'm2' ),
					makeMenuItem( 'm3' ),
					makeMenuItem( 'm1' ),
				],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( replaceInnerBlocks ).toHaveBeenCalledTimes( 1 );
			expect( replaceInnerBlocks ).toHaveBeenCalledWith(
				PANEL,
				[ t2, t3, t1 ], // tabs reordered to match menu items
				false
			);
			expect( removeBlock ).not.toHaveBeenCalled();
			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when menu items are in the same order', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];
			const props = {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			};

			const { rerender } = renderSync( props );
			rerender( props );

			expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		} );

		it( 'does nothing when tab-panel clientId is missing during reorder', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			rerender( {
				tabs,
				menuItems: [ makeMenuItem( 'm2' ), makeMenuItem( 'm1' ) ],
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'tab inserted', () => {
		it( 'inserts a menu item when a tab is pasted or duplicated', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// New tab 't3' inserted at the end.
			rerender( {
				tabs: [ ...tabs, makeTab( 't3', 'Tab 3' ) ],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					name: 'core/tabs-menu-item',
					attributes: {},
				} ),
				2, // index of the new tab
				MENU,
				false
			);
		} );

		it( 'does nothing when tabs-menu clientId is missing', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ) ];
			const menuItems = [];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: null,
			} );

			rerender( {
				tabs: [ ...tabs, makeTab( 't2', 'Tab 2' ) ],
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: null,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'syncs once (no duplicates) when tabs-menu clientId becomes available after a one-sided insertion', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ) ];
			const menuItems = [ makeMenuItem( 'm1' ) ];
			const tabsWithNew = [ ...tabs, makeTab( 't2', 'Tab 2' ) ];

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
					name: 'core/tabs-menu-item',
					attributes: {},
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
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Both grow together — "Add Tab" already created both.
			rerender( {
				tabs: [ ...tabs, makeTab( 't3', 'Tab 3' ) ],
				menuItems: [ ...menuItems, makeMenuItem( 'm3' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
			expect( removeBlock ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'menu item inserted', () => {
		it( 'inserts a tab when a menu item is pasted or duplicated', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// New menu item 'm3' appended at the end.
			rerender( {
				tabs,
				menuItems: [ ...menuItems, makeMenuItem( 'm3' ) ],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					name: 'core/tab',
					attributes: { label: 'Tab 2' }, // label copied from adjacent tab at index 1
				} ),
				2, // index of the new menu item
				PANEL,
				false
			);
		} );

		it( 'copies the label from the adjacent tab when a menu item is duplicated in the middle', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ), makeTab( 't2', 'Tab 2' ) ];
			const menuItems = [ makeMenuItem( 'm1' ), makeMenuItem( 'm2' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// 'm1-dup' is a duplicate of m1, inserted at index 1.
			rerender( {
				tabs,
				menuItems: [
					makeMenuItem( 'm1' ),
					makeMenuItem( 'm1-dup' ),
					makeMenuItem( 'm2' ),
				],
				tabPanelClientId: PANEL,
				tabsMenuClientId: MENU,
			} );

			// Tab inserted at index 1 should copy label from t1 (index 0).
			expect( insertBlock ).toHaveBeenCalledTimes( 1 );
			expect( insertBlock ).toHaveBeenCalledWith(
				expect.objectContaining( {
					name: 'core/tab',
					attributes: { label: 'Tab 1' },
				} ),
				1,
				PANEL,
				false
			);
		} );

		it( 'does nothing when tab-panel clientId is missing', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ) ];
			const menuItems = [ makeMenuItem( 'm1' ) ];

			const { rerender } = renderSync( {
				tabs,
				menuItems,
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			rerender( {
				tabs,
				menuItems: [ ...menuItems, makeMenuItem( 'm2' ) ],
				tabPanelClientId: null,
				tabsMenuClientId: MENU,
			} );

			expect( insertBlock ).not.toHaveBeenCalled();
		} );

		it( 'syncs once (no duplicates) when tab-panel clientId becomes available after a one-sided insertion', () => {
			const tabs = [ makeTab( 't1', 'Tab 1' ) ];
			const menuItems = [ makeMenuItem( 'm1' ) ];
			const menuItemsWithNew = [ ...menuItems, makeMenuItem( 'm2' ) ];

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
					name: 'core/tab',
					attributes: { label: 'Tab 1' },
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
