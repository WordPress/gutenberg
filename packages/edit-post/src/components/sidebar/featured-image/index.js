/**
 * WordPress dependencies
 */
import { PostFeaturedImage, PostFeaturedImageCheck } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'featured-image';

export default function FeaturedImage() {
	const isEnabled = useSelect(
		( select ) =>
			select( editPostStore ).isEditorPanelEnabled( PANEL_NAME ),
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
