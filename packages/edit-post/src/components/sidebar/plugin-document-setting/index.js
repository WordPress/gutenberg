/**
 * Defines as extensibility slot for the Settings sidebar
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withPluginContext } from '@wordpress/plugins';

export const { Fill, Slot } = createSlotFill( 'PluginDocumentSetting' );

/**
 * Renders items below the Status & Availability panel in the Document Sidebar.
 *
 * @param {Object} props Component properties.
 * @param {string} [props.className] An optional class name added to the row.
 * @param {string} [props.title] The title of the panel
 * @param {boolean} [props.isOpen] The open state of the panel. Optional.
 * @param {func} [props.onTogglePanel] The function that is run when the panel is toggled. Optional
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var el = wp.element.createElement;
 * var __ = wp.i18n.__;
 * var registerPlugin = wp.plugins.registerPlugin;
 * var PluginDocumentSetting = wp.editPost.PluginPostStatusInfo;
 *
 * function MyDocumentSettingPlugin() {
 * 	return el(
 * 		PluginDocumentSetting,
 *		{
 * 			className: 'my-document-setting-plugin',
 * 		},
 * 			__( 'My Document Setting Panel' )
 * 		);
 * 	};
 *
 * 	registerPlugin( 'my-document-setting-plugin', {
 * 	render: MyDocumentSettingPlugin
 * 	} );
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```jsx
 * // Using ESNext syntax
 * const { registerPlugin } = wp.plugins;
 * const { PluginDocumentSetting } = wp.editPost;
 *
 * const MyDocumentSettingTest = () => (
 * 		<PluginDocumentSetting className="my-document-setting-plugin">
 *			<p>My Document Setting Panel</p>
 *		</PluginDocumentSetting>
 *	);
 *
 *  registerPlugin( 'document-setting-test', { render: MyDocumentSettingTest } );
 * ```
 *
 * @return {WPElement} The WPElement to be rendered.
 */
const PluginDocumentSettingFill = ( { className, title, children, isOpened, onTogglePanel, ...props } ) => (
	<Fill>
		<PanelBody
			className={ className }
			title={ title }
			opened={ isOpened }
			onToggle={ onTogglePanel }
			{ ...props }
		>
			{ children }
		</PanelBody>
	</Fill>
);

const PluginDocumentSetting = compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
		};
	} ),
)( PluginDocumentSettingFill );

PluginDocumentSetting.Slot = Slot;
export default PluginDocumentSetting;
