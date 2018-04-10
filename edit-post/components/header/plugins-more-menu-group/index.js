/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill, MenuGroup } from '@wordpress/components';
import { PluginContext } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';

const { Fill, Slot } = createSlotFill( 'PluginsMoreMenuGroup' );

const PluginsMoreMenuGroup = ( { children } ) => (
	// Plugin's context needs to be forwarded to make it work properly with Dropdown.
	<PluginContext.Consumer>
		{ ( context ) => (
			<Fill>
				<PluginContext.Provider value={ context }>
					{ children }
				</PluginContext.Provider>
			</Fill>
		) }
	</PluginContext.Consumer>
);

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
