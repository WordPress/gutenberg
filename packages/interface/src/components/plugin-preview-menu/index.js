/**
 * WordPress dependencies
 */
import { createSlotFill, MenuItem } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginPreviewMenu' );

/**
 * Defines an extensibility slot for the device preview dropdown.
 *
 * The `title` and `icon` are used to populate the Preview menu item.
 *
 * @param {Object}   props         Component properties.
 * @param {string}   props.name    A unique name of the custom preview. Prefix with plugin name.
 * @param {Function} props.onClick Menu item click handler
 * @param {string}   props.title   Menu item title.
 */
const PluginPreviewMenu = ( { name, onClick, title, ...props } ) => (
	<Fill>
		<MenuItem
			className="block-editor-post-preview__button-resize"
			onClick={ ( ...args ) => {
				if ( onClick ) {
					onClick( ...args );
				}
			} }
			{ ...props }
		>
			{ title }
		</MenuItem>
	</Fill>
);

PluginPreviewMenu.Slot = Slot;

/**
 * Renders items in the devide preview dropdown within the editor header.
 *
 * @example
 * ```jsx
 * // Using ESNext syntax
 * import { PluginPreviewMenu } from '@wordpress/interface';
 * import { registerPlugin } from '@wordpress/plugins';
 *
 * const MyPreviewMenu = () => (
 *		<PluginPreviewMenu
 *			name="MyPreview"
 *			onClick={ () => {} }
 *			title="My preview"
 *		/>
 *	);
 *
 *  registerPlugin( 'my-preview-menu', { render: MyPreviewMenu } );
 * ```
 *
 * @return {WPComponent} The component to be rendered.
 */
export default PluginPreviewMenu;
