/**
 * External dependencies
 */
import { keyBy } from 'lodash';

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
			// load the auto-draft created from the
			// relevant file.
			if ( slug && theme ) {
				const cleanedSlug = cleanForSlug( slug );
				const posts = select( 'core' ).getEntityRecords(
					'postType',
					'wp_template_part',
					{
						status: [ 'publish', 'auto-draft' ],
						slug: cleanedSlug,
						theme,
					}
				);
				const themeTaxonomies = keyBy(
					select( 'core' ).getEntityRecords( 'taxonomy', 'wp_theme', {
						per_page: -1,
					} ),
					'name'
				);

				const foundPosts = posts?.filter(
					( post ) =>
						post.slug === cleanedSlug &&
						themeTaxonomies[ theme ] &&
						post.wp_theme.includes( themeTaxonomies[ theme ].id )
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
