/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useContext, useCallback } from '@wordpress/element';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelContext as ToolsPanelContext,
	createSlotFill,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const { Slot, Fill } = createSlotFill( 'InspectorControlsQueryFilters' );

export function QueryFilterToolsPanel( { children } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const {
		getBlockAttributes,
		getMultiSelectedBlockClientIds,
		getSelectedBlockClientId,
		hasMultiSelection,
	} = useSelect( blockEditorStore );

	const panelId = getSelectedBlockClientId();
	const resetAll = useCallback(
		( resetFilters = [] ) => {
			const newAttributes = {};

			const clientIds = hasMultiSelection()
				? getMultiSelectedBlockClientIds()
				: [ panelId ];

			clientIds.forEach( ( clientId ) => {
				const attributes = getBlockAttributes( clientId );
				let newBlockAttributes = { ...attributes };

				resetFilters.forEach( ( resetFilter ) => {
					newBlockAttributes = {
						...newBlockAttributes,
						...resetFilter( newBlockAttributes ),
					};
				} );

				newAttributes[ clientId ] = newBlockAttributes;
			} );

			updateBlockAttributes( clientIds, newAttributes, true );
		},
		[
			getBlockAttributes,
			getMultiSelectedBlockClientIds,
			hasMultiSelection,
			panelId,
			updateBlockAttributes,
		]
	);

	return (
		<ToolsPanel
			className="query-loop-block-filters-panel"
			label={ __( 'Filters' ) }
			resetAll={ resetAll }
			key={ panelId }
			panelId={ panelId }
			hasInnerWrapper={ true }
			shouldRenderPlaceholderItems={ true } // Required to maintain fills ordering.
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
		>
			{ children }
		</ToolsPanel>
	);
}

export function InspectorControlsQueryFiltersSlot( props ) {
	const slot = useSlot( 'InspectorControlsQueryFilters' );
	if ( ! Boolean( slot.fills?.length ) ) {
		return null;
	}
	return (
		<QueryFilterToolsPanel>
			<QuerySlotContainer { ...props } />
		</QueryFilterToolsPanel>
	);
}

function QuerySlotContainer( props ) {
	const toolsPanelContext = useContext( ToolsPanelContext );
	return (
		<Slot { ...props } fillProps={ toolsPanelContext } bubblesVirtually />
	);
}

function InspectorControlsQueryFilters( { children } ) {
	return (
		<Fill>
			{ ( fillProps ) => (
				<ToolsPanelContext.Provider value={ fillProps }>
					{ children }
				</ToolsPanelContext.Provider>
			) }
		</Fill>
	);
}

InspectorControlsQueryFilters.Slot = InspectorControlsQueryFiltersSlot;

export default InspectorControlsQueryFilters;
