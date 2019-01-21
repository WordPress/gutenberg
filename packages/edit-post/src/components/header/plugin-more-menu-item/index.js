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

const PluginMoreMenuItem = ( { onClick = noop, href, ...props } ) => {
	// Provide console warning if the href prop value is #
	if ( href === '#' ) {
		// eslint-disable-next-line no-console
		console.warn(
			'Links should trigger navigation. Replace href value for PluginMoreMenuItem component with a navigable URL.'
		);
	}

	return (
		<PluginsMoreMenuGroup>
			{ ( fillProps ) => (
				<MenuItem
					{ ...props }
					onClick={ compose(
						onClick,
						fillProps.onClose
					) }
				/>
			) }
		</PluginsMoreMenuGroup>
	);
};

export default compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
		};
	} )
)( PluginMoreMenuItem );
