/**
 * WordPress dependencies
 */
import { __experimentalUseSlot as useSlot, Slot } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import VisualEditor from './index';
import { store as editPostStore } from '../../store';

/**
 * Component that renders a preview slot fill if found or a VisualEditor instead.
 *
 * @param {Object} props Component properties.
 */
function VisualEditorOrPluginPreview( props ) {
	const previewId = useSelect(
		( select ) =>
			select( editPostStore ).__experimentalGetPreviewDeviceType(),
		[]
	);
	const slotName = `core/block-editor/plugin-preview/${ previewId }`;
	const slot = useSlot( slotName );

	if ( slot?.fills?.length > 0 ) {
		return <Slot name={ slotName } fillProps={ props } />;
	}

	return <VisualEditor { ...props } />;
}
export default VisualEditorOrPluginPreview;
