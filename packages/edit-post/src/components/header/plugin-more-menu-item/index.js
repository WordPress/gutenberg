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

const PluginMoreMenuItem = ( { onClick = noop, ...props } ) => (
	<PluginsMoreMenuGroup>
		{ ( fillProps ) => (
			<MenuItem
				{ ...props }
				onClick={ compose( onClick, fillProps.onClose ) }
			/>
		) }
	</PluginsMoreMenuGroup>
);

/**
 * Renders a menu item in `Plugins` group in `More Menu` drop down, and can be used to as a button or link depending on the props provided.
 * The text within the component appears as the menu item label.
 *
 * @param {Object} props Component properties.
 * @param {string} [props.href] When `href` is provided then the menu item is represented as an anchor rather than button. It corresponds to the `href` attribute of the anchor.
 * @param {string|Element} [props.icon=inherits from the plugin] The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered to the left of the menu item label.
 * @param {Function} [props.onClick=noop] The callback function to be executed when the user clicks the menu item.
 * @param {...*} [props.other] Any additional props are passed through to the underlying [MenuItem](/packages/components/src/menu-item/README.md) component.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var PluginMoreMenuItem = wp.editPost.PluginMoreMenuItem;
 *
 * function onButtonClick() {
 * 	alert( 'Button clicked.' );
 * }
 *
 * function MyButtonMoreMenuItem() {
 * 	return wp.element.createElement(
 * 		PluginMoreMenuItem,
 * 		{
 * 			icon: 'smiley',
 * 			onClick: onButtonClick
 * 		},
 * 		__( 'My button title' )
 * 	)
 * }
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```jsx
 * // Using ESNext syntax
 * const { __ } = wp.i18n;
 * const { PluginMoreMenuItem } = wp.editPost;
 *
 * function onButtonClick() {
 * 	alert( 'Button clicked.' );
 * }
 *
 * const MyButtonMoreMenuItem = () => (
 * 	<PluginMoreMenuItem
 * 		icon="smiley"
 * 		onClick={ onButtonClick }
 * 	>
 * 		{ __( 'My button title' ) }
 * 	</PluginMoreMenuItem>
 * );
 * ```
 *
 * @return {WPElement} The element to be rendered.
 */
export default compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
		};
	} ),
)( PluginMoreMenuItem );
