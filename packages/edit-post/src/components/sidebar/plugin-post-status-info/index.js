/**
 * Defines as extensibility slot for the Summary panel.
 */

/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostStatusRow from '../post-status-row';

export const { Fill, Slot } = createSlotFill( 'PluginPostStatusInfo' );

/**
 * Renders a row in the Summary panel of the Document sidebar.
 * It should be noted that this is named and implemented around the function it serves
 * and not its location, which may change in future iterations.
 *
 * @param {Object}    props             Component properties.
 * @param {string}    [props.className] An optional class name added to the row.
 * @param {string}    [props.label]     Optional label text. If specified, the row
 *                                      can be toggled by the user.
 * @param {WPElement} props.children    Children to be rendered.
 *
 * @example
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var PluginPostStatusInfo = wp.editPost.PluginPostStatusInfo;
 *
 * function MyPluginPostStatusInfo() {
 * 	return wp.element.createElement(
 * 		PluginPostStatusInfo,
 * 		{
 * 			className: 'my-plugin-post-status-info',
 * 		},
 * 		__( 'My post status info' )
 * 	)
 * }
 * ```
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { __ } from '@wordpress/i18n';
 * import { PluginPostStatusInfo } from '@wordpress/edit-post';
 *
 * const MyPluginPostStatusInfo = () => (
 * 	<PluginPostStatusInfo
 * 		className="my-plugin-post-status-info"
 * 	>
 * 		{ __( 'My post status info' ) }
 * 	</PluginPostStatusInfo>
 * );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
const PluginPostStatusInfo = ( { children, className, label } ) => (
	<Fill>
		{ label ? (
			<ToolsPanelItem className={ className } label={ label }>
				{ children }
			</ToolsPanelItem>
		) : (
			<PostStatusRow className={ className }>{ children }</PostStatusRow>
		) }
	</Fill>
);

PluginPostStatusInfo.Slot = Slot;

export default PluginPostStatusInfo;
