/**
 * External dependencies
 */
import { compact, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	MenuGroup,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	useConvertToGroupButtonProps,
	ConvertToGroupButton,
} from '../convert-to-group-buttons';
import { store as blockEditorStore } from '../../store';

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const BlockSettingsMenuControlsSlot = ( { fillProps, clientIds = null } ) => {
	const selectedBlocks = useSelect(
		( select ) => {
			const { getBlocksByClientId, getSelectedBlockClientIds } = select(
				blockEditorStore
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

	// Check if current selection of blocks is Groupable or Ungroupable
	// and pass this props down to ConvertToGroupButton.
	const convertToGroupButtonProps = useConvertToGroupButtonProps();
	const { isGroupable, isUngroupable } = convertToGroupButtonProps;
	const showConvertToGroupButton = isGroupable || isUngroupable;
	return (
		<Slot fillProps={ { ...fillProps, selectedBlocks } }>
			{ ( fills ) => {
				if ( fills?.length > 0 || showConvertToGroupButton ) {
					return (
						<MenuGroup>
							{ fills }
							<ConvertToGroupButton
								{ ...convertToGroupButtonProps }
								onClose={ fillProps?.onClose }
							/>
						</MenuGroup>
					);
				}
			} }
		</Slot>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-settings-menu-controls/README.md
 *
 * @param {Object} props  Fill props.
 * @return {WPElement} Element.
 */
function BlockSettingsMenuControls( { ...props } ) {
	return (
		<StyleProvider document={ document }>
			<Fill { ...props } />
		</StyleProvider>
	);
}

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlot;

export default BlockSettingsMenuControls;
