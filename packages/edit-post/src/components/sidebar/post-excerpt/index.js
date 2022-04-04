/**
 * WordPress dependencies
 */
import {
	PostExcerpt as PostExcerptForm,
	PostExcerptCheck,
} from '@wordpress/editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-excerpt';

export default function PostExcerpt( { isMinimal } ) {
	const isEnabled = useSelect(
		( select ) =>
			select( editPostStore ).isEditorPanelEnabled( PANEL_NAME ),
		[]
	);
	if ( ! isEnabled ) {
		return null;
	}
	return (
		<PostExcerptCheck>
			<PostExcerptForm isMinimal={ isMinimal } />
		</PostExcerptCheck>
	);
}
