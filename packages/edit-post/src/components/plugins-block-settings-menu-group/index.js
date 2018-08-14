/**
 * External dependencies
 */
import { isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

const { Fill: PluginsBlockSettingsMenuGroup, Slot } = createSlotFill( 'PluginsBlockSettingsMenuGroup' );

const PluginsBlockSettingsMenuGroupSlot = ( { fillProps, selectedBlocks } ) => {
	selectedBlocks = map( selectedBlocks, ( block ) => block.name );
	return (
		<Slot fillProps={ { ...fillProps, selectedBlocks } } >
			{ ( fills ) => ! isEmpty( fills ) && (
				<Fragment>
					<div className="editor-block-settings-menu__separator" />
					{ fills }
				</Fragment>
			) }
		</Slot>
	);
};

PluginsBlockSettingsMenuGroup.Slot = withSelect( ( select, { fillProps: { clientIds } } ) => ( {
	selectedBlocks: select( 'core/editor' ).getBlocksByClientId( clientIds ),
} ) )( PluginsBlockSettingsMenuGroupSlot );

export default PluginsBlockSettingsMenuGroup;
