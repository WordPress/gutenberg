/**
 * External dependencies
 */
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Slot, Fill, withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PluginSidebarMoreMenuItem from './plugin-sidebar-more-menu-item';
import PluginScreenTakeoverMoreMenuItem from './plugin-screen-takeover-more-menu-item';

/**
 * Name of slot in which the more menu items should fill.
 *
 * @type {string}
 */
export const SLOT_NAME = 'PluginMoreMenuItem';

let PluginMoreMenuItem = ( props ) => (
	<Fill name={ SLOT_NAME }>
		{ ( fillProps ) => {
			const { type, onClick = noop } = props;

			const newProps = { ...props, onClick: flow( onClick, fillProps.onClose ) };

			switch ( type ) {
				case 'sidebar':
					return <PluginSidebarMoreMenuItem { ...newProps } />;
				case 'screen-takeover':
					return <PluginScreenTakeoverMoreMenuItem { ...newProps } />;
			}
			return null;
		} }
	</Fill>
);

PluginMoreMenuItem = withContext( 'pluginName' )( ( pluginName, { target } ) => {
	return {
		target: `${ pluginName }/${ target }`,
	};
} )( PluginMoreMenuItem );

PluginMoreMenuItem.Slot = ( { fillProps } ) => (
	<Slot name={ SLOT_NAME } fillProps={ fillProps } />
);

export default PluginMoreMenuItem;
