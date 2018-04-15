/**
 * External dependencies
 */
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Slot, Fill } from '@wordpress/components';
import { PluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PluginSidebarMoreMenuItem from './plugin-sidebar-more-menu-item';

/**
 * Name of slot in which the more menu items should fill.
 *
 * @type {string}
 */
export const SLOT_NAME = 'PluginMoreMenuItem';

const PluginMoreMenuItem = ( props ) => (
	<PluginContext.Consumer>
		{ ( { pluginName } ) => (
			<Fill name={ SLOT_NAME }>
				{ ( fillProps ) => {
					const {
						target,
						type,
						onClick = noop,
					} = props;

					const newProps = {
						...props,
						onClick: flow( onClick, fillProps.onClose ),
						target: `${ pluginName }/${ target }`,
					};

					switch ( type ) {
						case 'sidebar':
							return <PluginSidebarMoreMenuItem { ...newProps } />;
					}
					return null;
				} }
			</Fill>
		) }
	</PluginContext.Consumer>
);

PluginMoreMenuItem.Slot = ( { fillProps } ) => (
	<Slot name={ SLOT_NAME } fillProps={ fillProps } />
);

export default PluginMoreMenuItem;
