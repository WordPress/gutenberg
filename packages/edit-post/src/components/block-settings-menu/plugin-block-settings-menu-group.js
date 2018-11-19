/**
 * External dependencies
 */
import { filter, isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

const { Fill: PluginBlockSettingsMenuGroup, Slot } = createSlotFill( 'PluginBlockSettingsMenuGroup' );

export const PluginBlockSettingsMenuGroupSlot = ( { fillProps, selectedBlocks } ) => {
	const blockNames = map( filter( selectedBlocks, ( block ) => ( block !== null ) && block.name ), ( block ) => block.name );
	if ( blockNames.length === 0 ) {
		return null;
	}

	return (
		<Slot fillProps={ { ...fillProps, selectedBlocks: blockNames } } >
			{ ( fills ) => ! isEmpty( fills ) && (
				<Fragment>
					<div className="editor-block-settings-menu__separator" />
					{ fills }
				</Fragment>
			) }
		</Slot>
	);
};

PluginBlockSettingsMenuGroup.Slot = withSelect( ( select, { fillProps: { clientIds } } ) => ( {
	selectedBlocks: select( 'core/editor' ).getBlocksByClientId( clientIds ),
} ) )( PluginBlockSettingsMenuGroupSlot );

export default PluginBlockSettingsMenuGroup;
