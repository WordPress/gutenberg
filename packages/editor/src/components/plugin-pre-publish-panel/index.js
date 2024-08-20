/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';
import { usePluginContext } from '@wordpress/plugins';

const { Fill, Slot } = createSlotFill( 'PluginPrePublishPanel' );

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
 * @param {Element}               props.children                        Children to be rendered
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { __ } from '@wordpress/i18n';
 * import { PluginPrePublishPanel } from '@wordpress/editor';
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
 * @return {Component} The component to be rendered.
 */
const PluginPrePublishPanel = ( {
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

PluginPrePublishPanel.Slot = Slot;

export default PluginPrePublishPanel;
