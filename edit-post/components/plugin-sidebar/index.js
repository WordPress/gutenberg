/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withFocusReturn } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { PluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import './style.scss';
import SidebarLayout from './sidebar-layout';

/**
 * Name of slot in which the sidebar should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginSidebar';

/**
 * Renders the plugin sidebar fill.
 *
 * @return {WPElement} Plugin sidebar fill.
 */
function PluginSidebar( { name, title, onClose, children } ) {
	return (
		<PluginContext.Consumer>
			{ ( { pluginName } ) => (
				<Fill name={ [ SLOT_NAME, pluginName, name ].join( '/' ) }>
					<SidebarLayout
						title={ title }
						onClose={ onClose } >
						{ children }
					</SidebarLayout>
				</Fill>
			) }
		</PluginContext.Consumer>
	);
}

PluginSidebar = compose( [
	withDispatch( dispatch => {
		return {
			onClose: dispatch( 'core/edit-post' ).closeGeneralSidebar,
		};
	} ),
	withFocusReturn,
] )( PluginSidebar );

/**
 * The plugin sidebar slot.
 *
 * @return {WPElement} The plugin sidebar slot.
 */
PluginSidebar.Slot = ( { name } ) => (
	<Slot name={ [ SLOT_NAME, name ].join( '/' ) } />
);

export default PluginSidebar;
