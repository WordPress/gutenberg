/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';

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
			// load the original post created from the
			// relevant file.
			if ( slug && theme ) {
				const cleanedSlug = cleanForSlug( slug );
				const posts = select( 'core' ).getEntityRecords(
					'postType',
					'wp_template_part',
					{
						status: [ 'publish' ],
						slug: cleanedSlug,
						theme,
					}
				);
				return posts?.[ 0 ]?.id;
			}
		},
		[ postId, slug, theme ]
	);
}
