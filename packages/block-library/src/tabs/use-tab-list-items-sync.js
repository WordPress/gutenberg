/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

const EMPTY_ARRAY = [];

/**
 * Keep the tab-list block's `tabs` attribute in sync with the core/tab-panel
 * blocks.
 *
 * The `tabs` attribute is the source of truth for tab labels; the panels
 * determine how many tabs exist and their order. Labels follow their panel
 * across additions, removals, and reordering by mapping each label back to its
 * panel and re-emitting in the current panel order.
 *
 * @param {string} clientId Client ID of the core/tabs block.
 */
export default function useTabListItemsSync( clientId ) {
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// The last emitted `tabs` and the panel order it was written against,
	// for remapping labels when the panel order changes.
	const lastTabsRef = useRef( null );
	const lastPanelClientIdsRef = useRef( null );

	const { tabPanels, tabListClientId, currentTabs } = useSelect(
		( select ) => {
			const { getBlocks, getBlockAttributes } =
				select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );

			const tabPanelsBlock = innerBlocks.find(
				( block ) => block.name === 'core/tab-panels'
			);
			const tabListBlock = innerBlocks.find(
				( block ) => block.name === 'core/tab-list'
			);
			const _tabListClientId = tabListBlock?.clientId ?? null;

			return {
				tabPanels: tabPanelsBlock?.innerBlocks ?? EMPTY_ARRAY,
				tabListClientId: _tabListClientId,
				currentTabs: _tabListClientId
					? getBlockAttributes( _tabListClientId )?.tabs ??
					  EMPTY_ARRAY
					: EMPTY_ARRAY,
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! tabListClientId ) {
			return;
		}

		const currentPanelClientIds = tabPanels.map(
			( tabPanel ) => tabPanel.clientId
		);

		// If the store still holds our last output, only the panels changed, so
		// map labels from the order we last wrote.
		const tabsMatchLastEmitted =
			lastTabsRef.current !== null &&
			JSON.stringify( currentTabs ) ===
				JSON.stringify( lastTabsRef.current );
		const basisPanelClientIds = tabsMatchLastEmitted
			? lastPanelClientIdsRef.current
			: currentPanelClientIds;

		// Map each label back to the tab panel it belonged to.
		const labelsByClientId = new Map();
		basisPanelClientIds.forEach( ( id, index ) => {
			if ( index < currentTabs.length ) {
				labelsByClientId.set( id, currentTabs[ index ].label ?? '' );
			}
		} );

		// Rebuild tabs in the current tab panel order.
		const newTabs = tabPanels.map( ( tabPanel ) => ( {
			label: labelsByClientId.has( tabPanel.clientId )
				? labelsByClientId.get( tabPanel.clientId )
				: __( 'Tab' ),
		} ) );

		// Record what is being written and the order it is written in so the next
		// run can both detect tabs changes and remap labels.
		lastPanelClientIdsRef.current = currentPanelClientIds;
		lastTabsRef.current = newTabs;

		if ( JSON.stringify( newTabs ) === JSON.stringify( currentTabs ) ) {
			return;
		}

		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( tabListClientId, { tabs: newTabs } );
	}, [
		tabPanels,
		currentTabs,
		tabListClientId,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );
}
