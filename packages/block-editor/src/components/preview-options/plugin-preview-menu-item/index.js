/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { coreDeviceTypes, PluginPreviewMenuFill } from '../index';

/**
 * Component used by a plugin to define the contents of a menu item that
 * selects a "custom preview". The children of this component will be displayed
 * inside the preview menu. Typically a single string is good enough.
 *
 * @param {Object}    props           Component properties.
 * @param {WPElement} props.children  Children to be rendered.
 * @param {WPIcon}    props.icon      Menu item icon to be rendered.
 * @param {Function}  props.onClick   Menu item click handler, e.g. for previews that do not register slot fills.
 * @param {string}    props.previewId The internal name of this custom preview. Must match the _previewId_ given to `PluginPreview`.
 */
export default function PluginPreviewMenuItem( {
	children,
	icon,
	onClick,
	previewId,
	...props
} ) {
	if ( coreDeviceTypes.includes( previewId ) ) {
		return null;
	}

	return (
		<PluginPreviewMenuFill>
			{ ( { deviceType, setDeviceType } ) => (
				<MenuItem
					onClick={ ( ...args ) => {
						if ( previewId ) {
							setDeviceType( previewId );
						}
						if ( onClick ) {
							onClick( ...args );
						}
					} }
					icon={ icon || ( deviceType === previewId && check ) }
					{ ...props }
				>
					{ children }
				</MenuItem>
			) }
		</PluginPreviewMenuFill>
	);
}
