/**
 * Defines as extensibility slot for the Page Attributes panel.
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelRow } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'PluginPageAttributesPanel' );

/**
 * Renders a row in the Page Attributes panel of the Document sidebar.
 *
 * @param {Object}  props             Component properties.
 * @param {string}  [props.className] An optional class name added to the row.
 * @param {Element} props.children    Children to be rendered.
 *
 * @example
 * ```js
 * // Using ES5 syntax
 * var __ = wp.i18n.__;
 * var PluginPageAttributesPanel = wp.editPost.PluginPageAttributesPanel;
 *
 * function MyPluginPageAttributes() {
 * 	return React.createElement(
 * 		PluginPageAttributesPanel,
 * 		{
 * 			className: 'my-plugin-page-attributes',
 * 		},
 * 		__( 'My page attributes' )
 * 	)
 * }
 * ```
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { __ } from '@wordpress/i18n';
 * import { PluginPageAttributesPanel } from '@wordpress/edit-post';
 *
 * const MyPluginPageAttributes = () => (
 * 	<PluginPageAttributesPanel
 * 		className="my-plugin-page-attributes"
 * 	>
 * 		{ __( 'My page attributes' ) }
 * 	</PluginPageAttributesPanel>
 * );
 * ```
 *
 * @return {Component} The component to be rendered.
 */
const PluginPageAttributesPanel = ( { children, className } ) => (
	<Fill>
		<PanelRow className={ className }>{ children }</PanelRow>
	</Fill>
);

PluginPageAttributesPanel.Slot = Slot;

export default PluginPageAttributesPanel;
