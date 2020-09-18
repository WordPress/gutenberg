/**
 * WordPress dependencies
 */
import { Fill, MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { coreDeviceTypes } from '../index';

/**
 * Component used by a plugin to define the contents of a menu item that
 * selects a "custom preview". The children of this component will be displayed
 * inside the preview menu. Typically a single string is good enough.
 *
 * @param {Object} props          Component properties.
 * @param {string} props.previewId The internal name of this custom preview. Must match the _previewId_ given to `PluginPreview`.
 * @param {WPElement} props.children Children to be rendered.
 */
export default function PluginPreviewMenuItem( {
	children,
	previewId,
	...props
} ) {
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( 'core/edit-post' );

	const { deviceType } = useSelect(
		( select ) => ( {
			deviceType: select(
				'core/edit-post'
			).__experimentalGetPreviewDeviceType(),
		} ),
		[]
	);

	if ( coreDeviceTypes.includes( previewId ) ) {
		return null;
	}

	return (
		<Fill name="core/block-editor/plugin-preview-menu" { ...props }>
			<MenuItem
				onClick={ () => setPreviewDeviceType( previewId ) }
				icon={ deviceType === previewId && check }
			>
				{ children }
			</MenuItem>
		</Fill>
	);
}
