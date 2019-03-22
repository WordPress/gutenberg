/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'PluginPostPublishPanel' );

/**
 * Renders provided content to the post-publish panel in the publish flow
 * (side panel that opens after a user publishes the post).
 *
 * @param {Object} props Component properties.
 * @param {string} [props.className] An optional class name added to the panel.
 * @param {string} [props.title] Title displayed at the top of the panel.
 * @param {boolean} [props.initialOpen=false] Whether to have the panel initially opened. When no title is provided it is always opened.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var PluginPostPublishPanel = wp.editPost.PluginPostPublishPanel;
 *
 * function MyPluginPostPublishPanel() {
 * 	return wp.element.createElement(
 * 		PluginPostPublishPanel,
 * 		{
 * 			className: 'my-plugin-post-publish-panel',
 * 			title: __( 'My panel title' ),
 * 			initialOpen: true,
 * 		},
 * 		__( 'My panel content' )
 * 	);
 * }
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```jsx
 * // Using ESNext syntax
 * const { __ } = wp.i18n;
 * const { PluginPostPublishPanel } = wp.editPost;
 *
 * const MyPluginPostPublishPanel = () => (
 * 	<PluginPostPublishPanel
 * 		className="my-plugin-post-publish-panel"
 * 		title={ __( 'My panel title' ) }
 * 		initialOpen={ true }
 * 	>
 *         { __( 'My panel content' ) }
 * 	</PluginPostPublishPanel>
 * );
 * ```
 *
 * @return {WPElement} The WPElement to be rendered.
 */
const PluginPostPublishPanel = ( { children, className, title, initialOpen = false } ) => (
	<Fill>
		<PanelBody
			className={ className }
			initialOpen={ initialOpen || ! title }
			title={ title }
		>
			{ children }
		</PanelBody>
	</Fill>
);

PluginPostPublishPanel.Slot = Slot;

export default PluginPostPublishPanel;
