/**
 * WordPress dependencies
 */
import { Fill } from '@wordpress/components';

export default function PluginPreview( { children, deviceName, ...props } ) {
	return (
		<Fill
			name={ 'core/block-editor/plugin-preview/' + deviceName }
			{ ...props }
		>
			{ children }
		</Fill>
	);
}
