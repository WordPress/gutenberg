/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

/**
 * Custom hook to get the page type badge for the current post on edit site view.
 */
export default function usePageTypeBadge() {
	const { isFrontPage, isPostsPage } = useSelect( ( select ) => {
		const { getCurrentPostId } = select( editorStore );
		const { canUser, getEditedEntityRecord } = select( coreStore );
		const _postId = getCurrentPostId();
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;

		return {
			isFrontPage: siteSettings?.page_on_front === _postId,
			isPostsPage: siteSettings?.page_for_posts === _postId,
		};
	} );

	if ( isFrontPage ) {
		return __( 'Homepage' );
	} else if ( isPostsPage ) {
		return __( 'Posts Page' );
	}

	return false;
}
