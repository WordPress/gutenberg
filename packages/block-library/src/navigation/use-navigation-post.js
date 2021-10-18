/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useNavigationPost( navigationPostId ) {
	return useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				getEntityRecords,
				hasFinishedResolution,
			} = select( coreStore );

			const navigationPostSingleArgs = [
				'postType',
				'wp_navigation',
				navigationPostId,
			];
			const navigationPost = navigationPostId
				? getEditedEntityRecord( ...navigationPostSingleArgs )
				: null;
			const hasResolvedNavigationPost = navigationPostId
				? hasFinishedResolution(
						'getEditedEntityRecord',
						navigationPostSingleArgs
				  )
				: false;

			const navigationPostsArgs = [ 'postType', 'wp_navigation' ];
			const navigationPosts = getEntityRecords( ...navigationPostsArgs );

			const canSwitchNavigationPost = navigationPostId
				? navigationPosts?.length > 1
				: navigationPosts?.length > 0;

			return {
				isNavigationPostResolved: hasResolvedNavigationPost,
				isNavigationPostMissing:
					hasResolvedNavigationPost && ! navigationPost,
				canSwitchNavigationPost,
				hasResolvedNavigationPosts: hasFinishedResolution(
					'getEntityRecords',
					navigationPostsArgs
				),
				navigationPost,
				navigationPosts,
			};
		},
		[ navigationPostId ]
	);
}
