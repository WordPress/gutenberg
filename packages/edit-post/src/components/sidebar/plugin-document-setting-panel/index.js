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
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { EnablePluginDocumentSettingPanelOption } from '../../preferences-modal/options';
import { store as editPostStore } from '../../../store';

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
 * @example
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
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { registerPlugin } from '@wordpress/plugins';
 * import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
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
		if ( undefined === ownProps.name ) {
			warning( 'PluginDocumentSettingPanel requires a name property.' );
		}
		return {
			icon: ownProps.icon || context.icon,
			panelName: `${ context.name }/${ ownProps.name }`,
		};
	} ),
	withSelect( ( select, { panelName } ) => {
		return {
			opened: select( editPostStore ).isEditorPanelOpened( panelName ),
			isEnabled: select( editPostStore ).isEditorPanelEnabled(
				panelName
			),
		};
	} ),
	withDispatch( ( dispatch, { panelName } ) => ( {
		onToggle() {
			return dispatch( editPostStore ).toggleEditorPanelOpened(
				panelName
			);
		},
	} ) )
)( PluginDocumentSettingFill );

PluginDocumentSettingPanel.Slot = Slot;

export default PluginDocumentSettingPanel;
