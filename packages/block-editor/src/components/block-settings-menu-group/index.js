/**
 * External dependencies
 */
import { isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill, MenuGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const { Fill: BlockSettingsMenuGroup, Slot } = createSlotFill(
	'BlockSettingsMenuGroup'
);

const BlockSettingsMenuGroupSlot = ( { fillProps } ) => {
	const { selectedBlocks } = useSelect( ( select ) => {
		const { getBlocksByClientId, getSelectedBlockClientIds } = select(
			'core/block-editor'
		);
		return {
			selectedBlocks: map(
				getBlocksByClientId( getSelectedBlockClientIds() ),
				( block ) => block.name
			),
		};
	}, [] );

	return (
		<Slot fillProps={ { ...fillProps, selectedBlocks } }>
			{ ( fills ) =>
				! isEmpty( fills ) && <MenuGroup>{ fills }</MenuGroup>
			}
		</Slot>
	);
};

BlockSettingsMenuGroup.Slot = BlockSettingsMenuGroupSlot;
/**
 * SlotFill component that offers a hook
 * into the BlockSettingsMenu.
 */
export default BlockSettingsMenuGroup;
