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
 * @param {string}    props.previewId The internal name of this custom preview. Must match the _previewId_ given to `PluginPreview`.
 * @param {WPElement} props.children  Children to be rendered.
 */
export default function PluginPreviewMenuItem( {
	children,
	previewId,
	...props
} ) {
	if ( coreDeviceTypes.includes( previewId ) ) {
		return null;
	}

	return (
		<PluginPreviewMenuFill { ...props }>
			{ ( { deviceType, setDeviceType } ) => (
				<MenuItem
					onClick={ () => setDeviceType( previewId ) }
					icon={ deviceType === previewId && check }
				>
					{ children }
				</MenuItem>
			) }
		</PluginPreviewMenuFill>
	);
}
