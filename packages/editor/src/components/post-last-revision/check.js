/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { usePostTypeSupportCheck } from '../post-type-support-check';

export default function PostLastRevisionCheck( { children } ) {
	return usePostLastRevisionCheck() ? children : null;
}

export function usePostLastRevisionCheck() {
	const hasRevisions = useSelect( ( select ) => {
		const lastRevisionId =
			select( editorStore ).getCurrentPostLastRevisionId();
		const revisionsCount =
			select( editorStore ).getCurrentPostRevisionsCount();
		return !! lastRevisionId && revisionsCount >= 2;
	}, [] );
	const hasPostTypeSupport = usePostTypeSupportCheck( 'revisions' );
	return hasRevisions && hasPostTypeSupport;
}
