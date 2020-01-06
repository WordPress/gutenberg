/**
 * WordPress dependencies
 */
import { Button, Panel } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { withPluginContext } from '@wordpress/plugins';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PinnedPlugins from '../../header/pinned-plugins';
import Sidebar from '../';
import SidebarHeader from '../sidebar-header';

function PluginSidebar( props ) {
	const {
		children,
		className,
		icon,
		isActive,
		isPinnable = true,
		isPinned,
		sidebarName,
		title,
		togglePin,
		toggleSidebar,
	} = props;

	return (
		<>
			{ isPinnable && (
				<PinnedPlugins>
					{ isPinned && <Button
						icon={ icon }
						label={ title }
						onClick={ toggleSidebar }
						isPressed={ isActive }
						aria-expanded={ isActive }
					/> }
				</PinnedPlugins>
			) }
			<Sidebar name={ sidebarName }>
				<SidebarHeader
					closeLabel={ __( 'Close plugin' ) }
				>
					<strong>{ title }</strong>
					{ isPinnable && (
						<Button
							icon={ isPinned ? 'star-filled' : 'star-empty' }
							label={ isPinned ? __( 'Unpin from toolbar' ) : __( 'Pin to toolbar' ) }
							onClick={ togglePin }
							isPressed={ isPinned }
							aria-expanded={ isPinned }
						/>
					) }
				</SidebarHeader>
				<Panel className={ className }>
					{ children }
				</Panel>
			</Sidebar>
		</>
	);
}

/**
 * Renders a sidebar when activated. The contents within the `PluginSidebar` will appear as content within the sidebar.
 * If you wish to display the sidebar, you can with use the `PluginSidebarMoreMenuItem` component or the `wp.data.dispatch` API:
 *
 * ```js
 * wp.data.dispatch( 'core/edit-post' ).openGeneralSidebar( 'plugin-name/sidebar-name' );
 * ```
 *
 * @see PluginSidebarMoreMenuItem
 *
 * @param {Object} props Element props.
 * @param {string} props.name A string identifying the sidebar. Must be unique for every sidebar registered within the scope of your plugin.
 * @param {string} [props.className] An optional class name added to the sidebar body.
 * @param {string} props.title Title displayed at the top of the sidebar.
 * @param {boolean} [props.isPinnable=true] Whether to allow to pin sidebar to toolbar.
 * @param {WPBlockTypeIconRender} [props.icon=inherits from the plugin] The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered when the sidebar is pinned to toolbar.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var el = wp.element.createElement;
 * var PanelBody = wp.components.PanelBody;
 * var PluginSidebar = wp.editPost.PluginSidebar;
 *
 * function MyPluginSidebar() {
 * 	return el(
 * 			PluginSidebar,
 * 			{
 * 				name: 'my-sidebar',
 * 				title: 'My sidebar title',
 * 				icon: 'smiley',
 * 			},
 * 			el(
 * 				PanelBody,
 * 				{},
 * 				__( 'My sidebar content' )
 * 			)
 * 	);
 * }
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```jsx
 * // Using ESNext syntax
 * const { __ } = wp.i18n;
 * const { PanelBody } = wp.components;
 * const { PluginSidebar } = wp.editPost;
 *
 * const MyPluginSidebar = () => (
 * 	<PluginSidebar
 * 		name="my-sidebar"
 * 		title="My sidebar title"
 * 		icon="smiley"
 * 	>
 * 		<PanelBody>
 * 			{ __( 'My sidebar content' ) }
 * 		</PanelBody>
 * 	</PluginSidebar>
 * );
 * ```
 *
 * @return {WPComponent} Plugin sidebar component.
 */
export default compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
			sidebarName: `${ context.name }/${ ownProps.name }`,
		};
	} ),
	withSelect( ( select, { sidebarName } ) => {
		const {
			getActiveGeneralSidebarName,
			isPluginItemPinned,
		} = select( 'core/edit-post' );

		return {
			isActive: getActiveGeneralSidebarName() === sidebarName,
			isPinned: isPluginItemPinned( sidebarName ),
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
