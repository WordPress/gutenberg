/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostFeaturedImage from './index';
import PostFeaturedImageCheck from './check';

const PANEL_NAME = 'featured-image';

function FeaturedImage() {
	const isEnabled = useSelect(
		( select ) => select( editorStore ).isEditorPanelEnabled( PANEL_NAME ),
		[]
	);
	if ( ! isEnabled ) {
		return null;
	}
	return (
		<PostFeaturedImageCheck>
			<PostFeaturedImage />
		</PostFeaturedImageCheck>
	);
}

export default FeaturedImage;
