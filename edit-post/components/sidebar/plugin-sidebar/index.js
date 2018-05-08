/**
 * WordPress dependencies
 */
import { IconButton, Panel } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PinnedPlugins from '../../header/pinned-plugins';
import Sidebar from '../';
import SidebarHeader from '../sidebar-header';

/**
 * Renders the plugin sidebar component.
 *
 * @param {Object} props Element props.
 * @return {WPElement} Plugin sidebar component.
 */
function PluginSidebar( props ) {
	const {
		children,
		icon = 'admin-plugins',
		isActive,
		isPinned,
		pinnable = true,
		sidebarName,
		title,
		togglePin,
		toggleSidebar,
	} = props;

	return (
		<Fragment>
			{ pinnable && (
				<PinnedPlugins>
					{ isPinned && <IconButton
						icon={ icon }
						label={ title }
						onClick={ toggleSidebar }
						isToggled={ isActive }
						aria-expanded={ isActive }
					/> }
				</PinnedPlugins>
			) }
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
							label={ isPinned ? __( 'Unpin from toolbar' ) : __( 'Pin to toolbar' ) }
							isToggled={ isPinned }
							aria-expanded={ isPinned }
						/>
					) }
				</SidebarHeader>
				<Panel>
					{ children }
				</Panel>
			</Sidebar>
		</Fragment>
	);
}

export default compose(
	withPluginContext,
	withSelect( ( select, { name, pluginContext } ) => {
		const {
			getActiveGeneralSidebarName,
			isPluginItemPinned,
		} = select( 'core/edit-post' );
		const sidebarName = `${ pluginContext.name }/${ name }`;

		return {
			isActive: getActiveGeneralSidebarName() === sidebarName,
			isPinned: isPluginItemPinned( sidebarName ),
			sidebarName,
		};
	} ),
	withDispatch( ( dispatch, { isActive, sidebarName } ) => {
		const {
			closeGeneralSidebar,
			openGeneralSidebar,
			togglePinnedPluginItem,
		} = dispatch( 'core/edit-post' );

		return {
			togglePin() {
				togglePinnedPluginItem( sidebarName );
			},
			toggleSidebar() {
				if ( isActive ) {
					closeGeneralSidebar();
				} else {
					openGeneralSidebar( sidebarName );
				}
			},
		};
	} ),
)( PluginSidebar );
