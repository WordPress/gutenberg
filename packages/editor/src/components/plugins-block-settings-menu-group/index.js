/**
 * External dependencies
 */
import { isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

const { Fill: PluginsBlockSettingsMenuGroup, Slot } = createSlotFill( 'PluginsBlockSettingsMenuGroup' );

PluginsBlockSettingsMenuGroup.Slot = ( { fillProps } ) => {
	const selectedBlockNames = map( fillProps.blocks, ( block ) => block.name );
	return (
		<Slot fillProps={ { onClose: fillProps.onClose, selectedBlockNames } } >
			{ ( fills ) => ! isEmpty( fills ) && (
				<Fragment>
					<div className="editor-block-settings-menu__separator" />
					{ fills }
				</Fragment>
			) }
		</Slot>
	);
};

export default PluginsBlockSettingsMenuGroup;
