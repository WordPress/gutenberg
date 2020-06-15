/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	Button,
	__experimentalToolbarItem as ToolbarItem,
	Dropdown,
} from '@wordpress/components';
import warning from '@wordpress/warning';
import { plugins as pluginsIcon } from '@wordpress/icons';
import { compose } from '@wordpress/compose';
import { withPluginContext } from '@wordpress/plugins';

const { Fill, Slot } = createSlotFill( 'PluginHeaderToolbar' );

const PluginHeaderToolbarFill = ( {
	icon = pluginsIcon,
	renderContent = null,
	className = 'plugin-header-toolbar-button',
	contentClassName = 'plugin-header-toolbar-content',
	position = 'bottom right',
} ) => {
	if ( null === renderContent || ! isFunction( renderContent ) ) {
		warning(
			'PluginHeaderToolbar requires renderContent property to be specified and be a valid function.'
		);
		return null;
	}
	return (
		<Fill>
			<ToolbarItem
				as={ () => (
					<Dropdown
						className={ className }
						contentClassName={ contentClassName }
						position={ position }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<Button
								onClick={ onToggle }
								aria-expanded={ isOpen }
								icon={ icon }
							/>
						) }
						renderContent={ renderContent }
					/>
				) }
			/>
		</Fill>
	);
};

/**
 * Renders a button and association dropdown in the header toolbar
 *
 * @param {Object} props Component properties.
 * @param {WPComponent} renderContent                                   The component to render as the UI for the dropdown.
 * @param {string} [props.className]                                    Optional. The class name for the button.
 * @param {string} [props.contentClassName]                             Optional. The class name of the dropdown item.
 * @param {string} [props.position]                                     Optional. The title of the panel
 * @param {WPBlockTypeIconRender} [props.icon=inherits from the plugin] The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered when the sidebar is pinned to toolbar.
 *
 * @example
 * <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var el = wp.element.createElement;
 * var __ = wp.i18n.__;
 * var registerPlugin = wp.plugins.registerPlugin;
 * var PluginHeaderToolbar = wp.editPost.PluginDocumentSettingPanel;
 *
 * function MyHeaderToolbarPlugin() {
 * 	return el(
 * 		PluginHeaderToolbar,
 * 		{
 * 			className: 'plugin-header-toolbar-button',
 * 			contentClassName: 'plugin-header-toolbar-content',
 * 			position: 'bottom left',
 *          renderContent: function() { return el( <div>Rendered Content</div>)}
 * 		},
 * 	);
 * }
 *
 * registerPlugin( 'my-header-toolbar-plugin', {
 * 		render: MyHeaderToolbarPlugin
 * } );
 * ```
 *
 * @example
 * <caption>ESNext</caption>
 * ```jsx
 * // Using ESNext syntax
 * const { registerPlugin } = wp.plugins;
 * const { PluginHeaderToolbar } = wp.editPost;
 *
 * const MyHeaderToolbarPlugin = () => (
 * 		<PluginHeaderToolbar
 *          className="plugin-header-toolbar-button"
 *          classContentName="plugin-header-toolbar-content"
 *          position="bottom left"
 *          renderContent={() => <div>Rendered Content</div>}
 *        />
 *	);
 *
 *  registerPlugin( 'my-header-toolbar-plugin', { render: MyDocumentSettingTest } );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
const PluginHeaderToolbar = compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
		};
	} )
)( PluginHeaderToolbarFill );

PluginHeaderToolbar.Slot = Slot;

export default PluginHeaderToolbar;
