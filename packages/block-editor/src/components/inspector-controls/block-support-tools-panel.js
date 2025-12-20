/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';

export default function BlockSupportToolsPanel( { children, group, label } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const {
		getBlockAttributes,
		getMultiSelectedBlockClientIds,
		getSelectedBlockClientId,
		hasMultiSelection,
	} = useSelect( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const panelId = getSelectedBlockClientId();
	const resetAll = useCallback(
		( resetFilters = [] ) => {
			const newAttributes = {};

			const clientIds = hasMultiSelection()
				? getMultiSelectedBlockClientIds()
				: [ panelId ];

			clientIds.forEach( ( clientId ) => {
				const { style } = getBlockAttributes( clientId );
				let newBlockAttributes = { style };

				resetFilters.forEach( ( resetFilter ) => {
					newBlockAttributes = {
						...newBlockAttributes,
						...resetFilter( newBlockAttributes ),
					};
				} );

				// Enforce a cleaned style object.
				newBlockAttributes = {
					...newBlockAttributes,
					style: cleanEmptyObject( newBlockAttributes.style ),
				};

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
			className={ `${ group }-block-support-panel` }
			label={ label }
			resetAll={ resetAll }
			key={ panelId }
			panelId={ panelId }
			hasInnerWrapper
			shouldRenderPlaceholderItems // Required to maintain fills ordering.
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
			dropdownMenuProps={ dropdownMenuProps }
		>
			{ children }
		</ToolsPanel>
	);
}
