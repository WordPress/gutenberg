import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

const EMPTY_ARRAY = [];

/**
 * Keep the tab-list block's `tabs` attribute and the tabs block's default tab
 * in sync with the tab-panel blocks.
 *
 * Whenever the list of core/tab-panel blocks changes (add, remove, reorder, or
 * label edit), this hook updates the `tabs` attribute on the core/tab-list
 * block so that save.jsx can render the correct buttons.
 *
 * It also keeps `activeTabIndex` on the default tab panel when tab panels are
 * moved, duplicated or deleted outside the tabs block's own controls, falling
 * back to the first tab when the default tab panel is removed. A store listener
 * does this, so the editor never renders a stale default tab.
 *
 * @param {string} tabsClientId Client ID of the core/tabs block.
 */
export default function useTabListItemsSync( tabsClientId ) {
	const registry = useRegistry();

	useEffect( () => {
		const { getBlocks, getBlockAttributes } =
			registry.select( blockEditorStore );
		const {
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		} = registry.dispatch( blockEditorStore );

		// The tab panel order and default tab seen on the previous change.
		let previous = null;

		const sync = () => {
			const innerBlocks = getBlocks( tabsClientId );
			const tabPanels =
				innerBlocks.find(
					( block ) => block.name === 'core/tab-panels'
				)?.innerBlocks ?? EMPTY_ARRAY;
			const activeTabIndex =
				getBlockAttributes( tabsClientId )?.activeTabIndex ?? 0;

			// The listener runs on every block editor change, so bail out
			// early when neither the tab panels nor the default tab changed.
			if (
				previous?.tabPanels === tabPanels &&
				previous.activeTabIndex === activeTabIndex
			) {
				return;
			}

			const tabList = innerBlocks.find(
				( block ) => block.name === 'core/tab-list'
			);
			const tabPanelClientIds = tabPanels
				.map( ( tab ) => tab.clientId )
				.join();

			// Follow the default tab panel when the tab panels were reordered,
			// added or removed. Skip it when `activeTabIndex` changed as well,
			// as the tabs block's own controls and undo already set it.
			let newDefaultIndex = activeTabIndex;
			if (
				previous?.defaultTabClientId &&
				previous.activeTabIndex === activeTabIndex &&
				previous.tabPanelClientIds !== tabPanelClientIds
			) {
				newDefaultIndex = Math.max(
					0,
					tabPanels.findIndex(
						( tab ) => tab.clientId === previous.defaultTabClientId
					)
				);
			}

			previous = {
				tabPanels,
				tabPanelClientIds,
				activeTabIndex: newDefaultIndex,
				defaultTabClientId: tabPanels[ newDefaultIndex ]?.clientId,
			};

			// Part of the change that reordered the tab panels, so undo
			// restores both in one step.
			if ( newDefaultIndex !== activeTabIndex ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( tabsClientId, {
					activeTabIndex: newDefaultIndex,
				} );
			}

			if ( ! tabList ) {
				return;
			}

			const newTabs = tabPanels.map( ( tab ) => ( {
				label: tab.attributes.label || '',
			} ) );

			// Skip the update when the stored tabs already match the derived
			// ones. Read them again, as the update above runs this listener
			// before returning.
			const currentTabs =
				getBlockAttributes( tabList.clientId )?.tabs ?? [];
			if ( JSON.stringify( newTabs ) === JSON.stringify( currentTabs ) ) {
				return;
			}

			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabList.clientId, { tabs: newTabs } );
		};

		sync();
		return registry.subscribe( sync, blockEditorStore );
	}, [ registry, tabsClientId ] );
}
