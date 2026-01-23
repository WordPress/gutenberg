/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { usePluginContext } from '@wordpress/plugins';
import { ActionItem } from '@wordpress/interface';

/**
 * Renders a menu item in the Preview dropdown, which can be used as a button or link depending on the props provided.
 * The text within the component appears as the menu item label.
 *
 * @param {Object}                props                                 Component properties.
 * @param {React.ReactNode}       [props.children]                      Children to be rendered.
 * @param {string}                [props.href]                          When `href` is provided, the menu item is rendered as an anchor instead of a button. It corresponds to the `href` attribute of the anchor.
 * @param {WPBlockTypeIconRender} [props.icon=inherits from the plugin] The icon to be rendered to the left of the menu item label. Can be a Dashicon slug or an SVG WP element.
 * @param {Function}              [props.onClick]                       The callback function to be executed when the user clicks the menu item.
 * @param {...*}                  [props.other]                         Any additional props are passed through to the underlying MenuItem component.
 *
 * @example
 * ```jsx
 * import { __ } from '@wordpress/i18n';
 * import { PluginPreviewMenuItem } from '@wordpress/editor';
 * import { external } from '@wordpress/icons';
 *
 * function onPreviewClick() {
 *   // Handle preview action
 * }
 *
 * const ExternalPreviewMenuItem = () => (
 *   <PluginPreviewMenuItem
 *     icon={ external }
 *     onClick={ onPreviewClick }
 *   >
 *     { __( 'Preview in new tab' ) }
 *   </PluginPreviewMenuItem>
 * );
 * registerPlugin( 'external-preview-menu-item', {
 *     render: ExternalPreviewMenuItem,
 * } );
 * ```
 *
 * @return {React.ReactNode} The rendered menu item component.
 */
export default function PluginPreviewMenuItem( props ) {
	const context = usePluginContext();
	return (
		<ActionItem
			name="core/plugin-preview-menu"
			as={ props.as ?? MenuItem }
			icon={ props.icon || context.icon }
			{ ...props }
		/>
	);
}
