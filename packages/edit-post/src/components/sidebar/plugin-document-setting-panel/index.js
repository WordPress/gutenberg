/**
 * Defines as extensibility slot for the Settings sidebar
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withPluginContext } from '@wordpress/plugins';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { EnablePluginDocumentSettingPanelOption } from '../../options-modal/options';

export const { Fill, Slot } = createSlotFill( 'PluginDocumentSettingPanel' );

const PluginDocumentSettingFill = ( {
	isEnabled,
	panelName,
	opened,
	onToggle,
	className,
	title,
	icon,
	children,
} ) => {
	return (
		<>
			<EnablePluginDocumentSettingPanelOption
				label={ title }
				panelName={ panelName }
			/>
			<Fill>
				{ isEnabled && (
					<PanelBody
						className={ className }
						title={ title }
						icon={ icon }
						opened={ opened }
						onToggle={ onToggle }
					>
						{ children }
					</PanelBody>
				) }
			</Fill>
		</>
	);
};

/**
 * Renders items below the Status & Availability panel in the Document Sidebar.
 *
 * @param {Object} props Component properties.
 * @param {string} [props.name] The machine-friendly name for the panel.
 * @param {string} [props.className] An optional class name added to the row.
 * @param {string} [props.title] The title of the panel
 * @param {WPBlockTypeIconRender} [props.icon=inherits from the plugin] The [Dashicon](https://developer.wordpress.org/resource/dashicons/) icon slug string, or an SVG WP element, to be rendered when the sidebar is pinned to toolbar.
 *
 * @example <caption>ES5</caption>
 * ```js
 * // Using ES5 syntax
 * var el = wp.element.createElement;
 * var __ = wp.i18n.__;
 * var registerPlugin = wp.plugins.registerPlugin;
 * var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
 *
 * function MyDocumentSettingPlugin() {
 * 	return el(
 * 		PluginDocumentSettingPanel,
 * 		{
 * 			className: 'my-document-setting-plugin',
 * 			title: 'My Panel',
 * 		},
 * 		__( 'My Document Setting Panel' )
 * 	);
 * }
 *
 * registerPlugin( 'my-document-setting-plugin', {
 * 		render: MyDocumentSettingPlugin
 * } );
 * ```
 *
 * @example <caption>ESNext</caption>
 * ```jsx
 * // Using ESNext syntax
 * const { registerPlugin } = wp.plugins;
 * const { PluginDocumentSettingPanel } = wp.editPost;
 *
 * const MyDocumentSettingTest = () => (
 * 		<PluginDocumentSettingPanel className="my-document-setting-plugin" title="My Panel">
 *			<p>My Document Setting Panel</p>
 *		</PluginDocumentSettingPanel>
 *	);
 *
 *  registerPlugin( 'document-setting-test', { render: MyDocumentSettingTest } );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
const PluginDocumentSettingPanel = compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
			panelName: `${ context.name }/${ ownProps.name }`,
		};
	} ),
	withSelect( ( select, { panelName } ) => {
		return {
			opened: select( 'core/edit-post' ).isEditorPanelOpened( panelName ),
			isEnabled: select( 'core/edit-post' ).isEditorPanelEnabled(
				panelName
			),
		};
	} ),
	withDispatch( ( dispatch, { panelName } ) => ( {
		onToggle() {
			return dispatch( 'core/edit-post' ).toggleEditorPanelOpened(
				panelName
			);
		},
	} ) )
)( PluginDocumentSettingFill );

PluginDocumentSettingPanel.Slot = Slot;

export default PluginDocumentSettingPanel;
