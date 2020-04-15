/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export default function useTemplatePartPost( postId, slug, theme ) {
	return useSelect(
		( select ) => {
			if ( postId ) {
				return (
					select( 'core' ).getEntityRecord(
						'postType',
						'wp_template_part',
						postId
					) && postId
				);
			}

			if ( slug && theme ) {
				const posts = select( 'core' ).getEntityRecords(
					'postType',
					'wp_template_part',
					{
						status: [ 'publish', 'auto-draft' ],
						slug,
						meta: { theme },
					}
				);
				const foundPosts = posts?.filter(
					( post ) =>
						post.slug === slug &&
						post.meta &&
						post.meta.theme === theme
				);
				// A published post might already exist if this template part was customized elsewhere
				// or if it's part of a customized template.
				const foundPost =
					foundPosts?.find( ( post ) => post.status === 'publish' ) ||
					foundPosts?.find(
						( post ) => post.status === 'auto-draft'
					);
				return foundPost?.id;
			}
		},
		[ postId, slug, theme ]
	);
}
