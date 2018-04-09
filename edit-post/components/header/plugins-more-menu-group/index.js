/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill, MenuGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const { Fill: PluginsMoreMenuGroup, Slot } = createSlotFill( 'PluginsMoreMenuGroup' );

PluginsMoreMenuGroup.Slot = () => (
	<Slot>
		{ ( fills ) => ! isEmpty( fills ) && (
			<MenuGroup label={ __( 'Plugins' ) }>
				{ fills }
			</MenuGroup>
		) }
	</Slot>
);

export default PluginsMoreMenuGroup;
