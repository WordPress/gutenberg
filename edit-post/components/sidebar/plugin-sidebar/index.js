/**
 * WordPress dependencies
 */
import { IconButton, Panel } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import Sidebar from '../';
import SidebarHeader from '../sidebar-header';

/**
 * Renders the plugin sidebar component.
 *
 * @return {WPElement} Plugin sidebar component.
 */
function PluginSidebar( { children, isPinned, sidebarName, title, togglePin, pinnable = true } ) {
	return (
		<Sidebar
			name={ sidebarName }
			label={ __( 'Editor plugins' ) }
		>
			<SidebarHeader
				closeLabel={ __( 'Close plugin' ) }
			>
				<strong>{ title }</strong>
				{ pinnable && (
					<IconButton
						onClick={ togglePin }
						icon={ isPinned ? 'star-filled' : 'star-empty' }
						label={ isPinned ? __( 'Unpin plugin' ) : __( 'Pin plugin' ) }
						isToggled={ isPinned }
						aria-expanded={ isPinned }
					/>
				) }
			</SidebarHeader>
			<Panel>
				{ children }
			</Panel>
		</Sidebar>
	);
}

export default compose(
	withPluginContext,
	withSelect( ( select, { name, pluginContext } ) => {
		const {
			isPluginItemPinned,
		} = select( 'core/edit-post' );
		const sidebarName = `${ pluginContext.name }/${ name }`;

		return {
			isPinned: isPluginItemPinned( sidebarName ),
			sidebarName,
		};
	} ),
	withDispatch( ( dispatch, { sidebarName } ) => {
		const {
			togglePinnedPluginItem,
		} = dispatch( 'core/edit-post' );

		return {
			togglePin() {
				togglePinnedPluginItem( sidebarName );
			},
		};
	} ),
)( PluginSidebar );
