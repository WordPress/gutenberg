/**
 * External dependencies
 */
import { difference } from 'lodash';

/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PluginBlockSettingsMenuGroup from './plugin-block-settings-menu-group';

const isEverySelectedBlockAllowed = ( selected, allowed ) => difference( selected, allowed ).length === 0;

/**
 * Plugins may want to add an item to the menu either for every block
 * or only for the specific ones provided in the `allowedBlocks` component property.
 *
 * If there are multiple blocks selected the item will be rendered if every block
 * is of one allowed type (not necessarily the same).
 *
 * @param {string[]} selectedBlocks Array containing the names of the blocks selected
 * @param {string[]} allowedBlocks Array containing the names of the blocks allowed
 * @return {boolean} Whether the item will be rendered or not.
 */
const shouldRenderItem = ( selectedBlocks, allowedBlocks ) => ! Array.isArray( allowedBlocks ) ||
	isEverySelectedBlockAllowed( selectedBlocks, allowedBlocks );

/**
 * Renders a new item in the block settings menu.
 *
 * @param {Object} props Component props.
 * @param {Array} [props.allowedBlocks] An array containing a list of block names for which the item should be shown. If not present, it'll be rendered for any block. If multiple blocks are selected, it'll be shown if and only if all of them are in the whitelist.
 * @param {WPBlockTypeIconRender} [props.icon] The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element.
 * @param {string} props.label The menu item text.
 * @param {Function} props.onClick Callback function to be executed when the user click the menu item.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var PluginBlockSettingsMenuItem = wp.editPost.PluginBlockSettingsMenuItem;
 *
 * function doOnClick(){
 * 	// To be called when the user clicks the menu item.
 * }
 *
 * function MyPluginBlockSettingsMenuItem() {
 * 	return wp.element.createElement(
 * 		PluginBlockSettingsMenuItem,
 * 		{
 * 			allowedBlocks: [ 'core/paragraph' ],
 * 			icon: 'dashicon-name',
 * 			label: __( 'Menu item text' ),
 * 			onClick: doOnClick,
 * 		}
 * 	);
 * }
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```jsx
 * // Using ESNext syntax
 * import { __ } from wp.i18n;
 * import { PluginBlockSettingsMenuItem } from wp.editPost;
 *
 * const doOnClick = ( ) => {
 *     // To be called when the user clicks the menu item.
 * };
 *
 * const MyPluginBlockSettingsMenuItem = () => (
 *     <PluginBlockSettingsMenuItem
 * 		allowedBlocks=[ 'core/paragraph' ]
 * 		icon='dashicon-name'
 * 		label=__( 'Menu item text' )
 * 		onClick={ doOnClick } />
 * );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
const PluginBlockSettingsMenuItem = ( { allowedBlocks, icon, label, onClick, small, role } ) => (
	<PluginBlockSettingsMenuGroup>
		{ ( { selectedBlocks, onClose } ) => {
			if ( ! shouldRenderItem( selectedBlocks, allowedBlocks ) ) {
				return null;
			}
			return ( <MenuItem
				onClick={ compose( onClick, onClose ) }
				icon={ icon || 'admin-plugins' }
				label={ small ? label : undefined }
				role={ role }
			>
				{ ! small && label }
			</MenuItem> );
		} }
	</PluginBlockSettingsMenuGroup>
);

export default PluginBlockSettingsMenuItem;
