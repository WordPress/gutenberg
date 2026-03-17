/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Custom hook to get the page type badge for the current post on edit site view.
 *
 * @param {number|string} postId postId of the current post being edited.
 */
export default function usePageTypeBadge( postId ) {
	const { isFrontPage, isPostsPage } = useSelect( ( select ) => {
		const { canUser, getEditedEntityRecord } = select( coreStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;

		const _postId = parseInt( postId, 10 );

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
