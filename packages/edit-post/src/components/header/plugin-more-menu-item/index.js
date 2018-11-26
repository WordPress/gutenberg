/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { MenuItem } from '@wordpress/components';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PluginsMoreMenuGroup from '../plugins-more-menu-group';

const PluginMoreMenuItem = ( { children, icon, url, onClick = noop } ) => (
	<PluginsMoreMenuGroup>
		{ ( fillProps ) => (
			<MenuItem
				href={ url }
				icon={ icon }
				onClick={ compose( onClick, fillProps.onClose ) }
			>
				{ children }
			</MenuItem>
		) }
	</PluginsMoreMenuGroup>
);

export default compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
		};
	} ),
)( PluginMoreMenuItem );
