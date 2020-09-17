/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Slot } from '@wordpress/components';
import { coreDeviceTypes } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import VisualEditor from './index';

function VisualEditorOrPluginPreview() {
	const deviceType = useSelect( ( select ) => {
		return select( 'core/edit-post' ).__experimentalGetPreviewDeviceType();
	}, [] );

	if ( ! coreDeviceTypes.includes( deviceType ) ) {
		return (
			<Slot name={ 'core/block-editor/plugin-preview/' + deviceType } />
		);
	}
	return <VisualEditor />;
}
export default VisualEditorOrPluginPreview;
