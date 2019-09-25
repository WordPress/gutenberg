/**
 * External dependencies
 */
import { isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

const { Fill: PluginBlockSettingsMenuGroup, Slot } = createSlotFill( 'PluginBlockSettingsMenuGroup' );

const PluginBlockSettingsMenuGroupSlot = ( { fillProps, selectedBlocks } ) => {
	selectedBlocks = map( selectedBlocks, ( block ) => block.name );
	return (
		<Slot fillProps={ { ...fillProps, selectedBlocks } } >
			{ ( fills ) => ! isEmpty( fills ) && (
				<>
					<div className="editor-block-settings-menu__separator block-editor-block-settings-menu__separator" />
					{ fills }
				</>
			) }
		</Slot>
	);
};

PluginBlockSettingsMenuGroup.Slot = withSelect( ( select, { fillProps: { clientIds } } ) => ( {
	selectedBlocks: select( 'core/block-editor' ).getBlocksByClientId( clientIds ),
} ) )( PluginBlockSettingsMenuGroupSlot );

export default PluginBlockSettingsMenuGroup;
