/**
 * External dependencies
 */
import { compact, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill, MenuGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToGroupButton from '../convert-to-group-buttons';

const { Fill: BlockSettingsMenuControls, Slot } = createSlotFill(
	'BlockSettingsMenuControls'
);

const BlockSettingsMenuControlsSlot = ( { fillProps, clientIds = null } ) => {
	const selectedBlocks = useSelect(
		( select ) => {
			const { getBlocksByClientId, getSelectedBlockClientIds } = select(
				'core/block-editor'
			);
			const ids =
				clientIds !== null ? clientIds : getSelectedBlockClientIds();
			return map(
				compact( getBlocksByClientId( ids ) ),
				( block ) => block.name
			);
		},
		[ clientIds ]
	);

	return (
		<Slot fillProps={ { ...fillProps, selectedBlocks } }>
			{ ( fills ) => {
				return (
					<MenuGroup>
						{ fills }
						<ConvertToGroupButton onClose={ fillProps?.onClose } />
					</MenuGroup>
				);
			} }
		</Slot>
	);
};

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/block-settings-menu-controls/README.md
 */
export default BlockSettingsMenuControls;
