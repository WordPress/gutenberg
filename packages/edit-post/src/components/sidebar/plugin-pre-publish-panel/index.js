/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withPluginContext } from '@wordpress/plugins';
const { Fill, Slot } = createSlotFill( 'PluginPrePublishPanel' );

const PluginPrePublishPanelFill = ( {
	children,
	className,
	title,
	initialOpen = false,
	icon,
} ) => (
	<Fill>
		<PanelBody
			className={ className }
			initialOpen={ initialOpen || ! title }
			title={ title }
			icon={ icon }
		>
			{ children }
		</PanelBody>
	</Fill>
);

/**
 * Renders provided content to the pre-publish side panel in the publish flow
 * (side panel that opens when a user first pushes "Publish" from the main editor).
 *
 * @param {Object}                props                                 Component props.
 * @param {string}                [props.className]                     An optional class name added to the panel.
 * @param {string}                [props.title]                         Title displayed at the top of the panel.
 * @param {boolean}               [props.initialOpen=false]             Whether to have the panel initially opened.
 *                                                                      When no title is provided it is always opened.
 * @param {WPBlockTypeIconRender} [props.icon=inherits from the plugin] The [Dashicon](https://developer.wordpress.org/resource/dashicons/)
 *                                                                      icon slug string, or an SVG WP element, to be rendered when
 *                                                                      the sidebar is pinned to toolbar.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var PluginPrePublishPanel = wp.editPost.PluginPrePublishPanel;
 *
 * function MyPluginPrePublishPanel() {
 * 	return wp.element.createElement(
 * 		PluginPrePublishPanel,
 * 		{
 * 			className: 'my-plugin-pre-publish-panel',
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
 * const { PluginPrePublishPanel } = wp.editPost;
 *
 * const MyPluginPrePublishPanel = () => (
 * 	<PluginPrePublishPanel
 * 		className="my-plugin-pre-publish-panel"
 * 		title={ __( 'My panel title' ) }
 * 		initialOpen={ true }
 * 	>
 * 	    { __( 'My panel content' ) }
 * 	</PluginPrePublishPanel>
 * );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
const PluginPrePublishPanel = compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
		};
	} )
)( PluginPrePublishPanelFill );

PluginPrePublishPanel.Slot = Slot;

export default PluginPrePublishPanel;
