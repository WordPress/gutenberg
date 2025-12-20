/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlotFills as useSlotFills,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControlsGroups from '../inspector-controls/groups';
import { default as InspectorControls } from '../inspector-controls';
import { store as blockEditorStore } from '../../store';
import { useToolsPanelDropdownMenuProps } from '../global-styles/utils';
import { cleanEmptyObject } from '../../hooks/utils';

const PositionControlsPanel = () => {
	const { selectedClientIds, selectedBlocks, hasPositionAttribute } =
		useSelect( ( select ) => {
			const { getBlocksByClientId, getSelectedBlockClientIds } =
				select( blockEditorStore );

			const selectedBlockClientIds = getSelectedBlockClientIds();
			const _selectedBlocks = getBlocksByClientId(
				selectedBlockClientIds
			);

			return {
				selectedClientIds: selectedBlockClientIds,
				selectedBlocks: _selectedBlocks,
				hasPositionAttribute: _selectedBlocks?.some(
					( { attributes } ) => !! attributes?.style?.position?.type
				),
			};
		}, [] );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	function resetPosition() {
		if ( ! selectedClientIds?.length || ! selectedBlocks?.length ) {
			return;
		}

		const attributesByClientId = Object.fromEntries(
			selectedBlocks?.map( ( { clientId, attributes } ) => [
				clientId,
				{
					style: cleanEmptyObject( {
						...attributes?.style,
						position: {
							...attributes?.style?.position,
							type: undefined,
							top: undefined,
							right: undefined,
							bottom: undefined,
							left: undefined,
						},
					} ),
				},
			] )
		);

		updateBlockAttributes( selectedClientIds, attributesByClientId, true );
	}

	return (
		<ToolsPanel
			className="block-editor-block-inspector__position"
			label={ __( 'Position' ) }
			resetAll={ resetPosition }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				isShownByDefault={ hasPositionAttribute }
				label={ __( 'Position' ) }
				hasValue={ () => hasPositionAttribute }
				onDeselect={ resetPosition }
			>
				<InspectorControls.Slot group="position" />
			</ToolsPanelItem>
		</ToolsPanel>
	);
};

const PositionControls = () => {
	const fills = useSlotFills( InspectorControlsGroups.position.name );
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return <PositionControlsPanel />;
};

export default PositionControls;
