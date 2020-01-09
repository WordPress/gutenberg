/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export default function useTemplatePartPost( postId, slug, theme ) {
	return useSelect(
		( select ) => {
			if ( postId ) {
				// This is already a custom template part,
				// use its CPT post.
				return (
					select( 'core' ).getEntityRecord(
						'postType',
						'wp_template_part',
						postId
					) && postId
				);
			}

			// This is not a custom template part,
			// load the auto-draft created from the
			// relevant file.
			if ( slug && theme ) {
				const posts = select( 'core' ).getEntityRecords(
					'postType',
					'wp_template_part',
					{
						status: 'auto-draft',
						slug,
						meta: { theme },
					}
				);
				const foundPost =
					posts &&
					posts.find(
						( post ) => post.slug === slug && post.meta && post.meta.theme === theme
					);
				return foundPost && foundPost.id;
			}
		},
		[ postId, slug, theme ]
	);
}
