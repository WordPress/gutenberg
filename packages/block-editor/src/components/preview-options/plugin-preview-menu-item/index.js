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

export default function PluginPreviewMenuItem( {
	children,
	deviceName,
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

	if ( coreDeviceTypes.includes( deviceName ) ) {
		return null;
	}

	return (
		<Fill name="core/block-editor/plugin-preview-menu" { ...props }>
			<MenuItem
				onClick={ () => setPreviewDeviceType( deviceName ) }
				icon={ deviceType === deviceName && check }
			>
				{ children }
			</MenuItem>
		</Fill>
	);
}
