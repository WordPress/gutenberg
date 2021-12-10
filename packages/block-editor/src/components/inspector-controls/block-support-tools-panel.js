/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { cleanEmptyObject } from '../../hooks/utils';

export default function BlockSupportToolsPanel( { children, group, label } ) {
	const { attributes, clientIds, panelId } = useSelect( ( select ) => {
		const {
			getBlockAttributes,
			getMultiSelectedBlockClientIds,
			getSelectedBlockClientId,
			hasMultiSelection,
		} = select( blockEditorStore );

		// This is `null` if multi-selection and used in `clientId` checks
		// to still allow panel items to register themselves.
		const selectedBlockClientId = getSelectedBlockClientId();

		if ( hasMultiSelection() ) {
			const selectedBlockClientIds = getMultiSelectedBlockClientIds();
			const selectedBlockAttributes = selectedBlockClientIds.reduce(
				( blockAttributes, blockId ) => {
					blockAttributes[ blockId ] = getBlockAttributes( blockId );
					return blockAttributes;
				},
				{}
			);

			return {
				panelId: selectedBlockClientId,
				clientIds: selectedBlockClientIds,
				attributes: selectedBlockAttributes,
			};
		}

		return {
			panelId: selectedBlockClientId,
			clientIds: [ selectedBlockClientId ],
			attributes: {
				[ selectedBlockClientId ]: getBlockAttributes(
					selectedBlockClientId
				),
			},
		};
	}, [] );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const resetAll = ( resetFilters = [] ) => {
		const newAttributes = {};

		clientIds.forEach( ( clientId ) => {
			const { style } = attributes[ clientId ];
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
	};

	return (
		<ToolsPanel
			className={ `${ group }-block-support-panel` }
			label={ label }
			resetAll={ resetAll }
			key={ panelId }
			panelId={ panelId }
			hasInnerWrapper={ true }
			shouldRenderPlaceholderItems={ true } // Required to maintain fills ordering.
		>
			{ children }
		</ToolsPanel>
	);
}
