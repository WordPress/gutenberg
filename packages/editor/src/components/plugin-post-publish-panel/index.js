/**
 * WordPress dependencies
 */
import { usePluginContext } from '@wordpress/plugins';
import { createSlotFill, PanelBody } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'PluginPostPublishPanel' );

/**
 * Renders provided content to the post-publish panel in the publish flow
 * (side panel that opens after a user publishes the post).
 *
 * @param {Object}                props                                 Component properties.
 * @param {string}                [props.className]                     An optional class name added to the panel.
 * @param {string}                [props.title]                         Title displayed at the top of the panel.
 * @param {boolean}               [props.initialOpen=false]             Whether to have the panel initially opened. When no title is provided it is always opened.
 * @param {WPBlockTypeIconRender} [props.icon=inherits from the plugin] The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered when the sidebar is pinned to toolbar.
 * @param {React.ReactNode}       props.children                        Children to be rendered
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { __ } from '@wordpress/i18n';
 * import { PluginPostPublishPanel } from '@wordpress/editor';
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
 * @return {React.ReactNode} The rendered component.
 */
const PluginPostPublishPanel = ( {
	children,
	className,
	title,
	initialOpen = false,
	icon,
} ) => {
	const { icon: pluginIcon } = usePluginContext();

	return (
		<Fill>
			<PanelBody
				className={ className }
				initialOpen={ initialOpen || ! title }
				title={ title }
				icon={ icon ?? pluginIcon }
			>
				{ children }
			</PanelBody>
		</Fill>
	);
};

PluginPostPublishPanel.Slot = Slot;

export default PluginPostPublishPanel;
