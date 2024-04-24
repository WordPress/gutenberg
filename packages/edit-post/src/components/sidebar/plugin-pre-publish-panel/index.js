/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { PluginPrePublishPanel } from '@wordpress/editor';

/**
 * Renders provided content to the pre-publish side panel in the publish flow
 * (side panel that opens when a user first pushes "Publish" from the main editor).
 *
 * @deprecated since 6.6, use `wp.editor.PluginPrePublishPanel` instead.
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
 * @return {Component} The component to be rendered.
 */
export default function EditPostPluginPrePublishPanel( props ) {
	deprecated( 'wp.editPost.PluginPrePublishPanel', {
		since: '6.6',
		version: '6.8',
		alternative: 'wp.editor.PluginPrePublishPanel',
	} );
	return <PluginPrePublishPanel { ...props } />;
}
