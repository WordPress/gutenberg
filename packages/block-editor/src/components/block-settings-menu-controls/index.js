/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	MenuGroup,
	__experimentalUseSlot as useSlot,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const { Fill: BlockSettingsMenuControls, Slot } = createSlotFill(
	'BlockSettingsMenuControls'
);

const BlockSettingsMenuControlsSlot = ( { fillProps } ) => {
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
	const slot = useSlot( 'BlockSettingsMenuControls' );
	const hasFills = Boolean( slot.fills && slot.fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<MenuGroup>
			<Slot
				bubblesVirtually
				fillProps={ { ...fillProps, selectedBlocks } }
			/>
		</MenuGroup>
	);
};

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/block-settings-menu-controls/README.md
 */
export default BlockSettingsMenuControls;
