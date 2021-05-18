/**
 * WordPress dependencies
 */
import { __experimentalUseSlot as useSlot, Slot } from '@wordpress/components';

/**
 * Internal dependencies
 */
import VisualEditor from './index';

/**
 * Component that renders a preview slot fill if found or a VisualEditor instead.
 *
 * @param {Object} props           Component properties.
 * @param {string} props.previewId The internal name of this custom preview.
 */
function VisualEditorOrPluginPreview( { previewId, ...props } ) {
	const slotName = `core/block-editor/plugin-preview/${ previewId }`;
	const slot = useSlot( slotName );

	if ( slot?.fills?.length === 0 ) {
		return <VisualEditor { ...props } />;
	}

	return <Slot name={ slotName } fillProps={ props } />;
}
export default VisualEditorOrPluginPreview;
