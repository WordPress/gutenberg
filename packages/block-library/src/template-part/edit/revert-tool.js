/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
import { ToolbarButton } from '@wordpress/components';

export default function RevertToDefault( {
	postId,
	attributePostId,
	setAttributes,
} ) {
	const defaultTemplatePart = useSelect(
		( select ) => {
			const {
				meta: { original_slug: originalSlug, theme },
			} = select( 'core' ).getEntityRecord(
				'postType',
				'wp_template_part',
				postId
			);

			// For a theme supplied template part we would expect original_slug to be
			// present in the meta given the field we added in template-loader.
			// But inspecting the theme supplied template part or customized/published version
			// 'theme' seems to be the only meta value present.

			const defaultMatches = select( 'core' ).getEntityRecords(
				'postType',
				'wp_template_part',
				{
					status: [ 'auto-draft' ],
					slug: cleanForSlug( originalSlug ),
					theme,
				}
			);

			return defaultMatches?.find(
				( post ) =>
					post.slug === cleanForSlug( originalSlug ) &&
					post.meta.theme === theme
			);
		},
		[ postId ]
	);

	// Having attributePostId implies we are on a published template part.
	// If we found a default that looks good, allow a button to revert.
	if ( attributePostId && defaultTemplatePart && defaultTemplatePart.id ) {
		const {
			slug,
			meta: { theme },
		} = defaultTemplatePart;
		return (
			<ToolbarButton
				onClick={ () => {
					setAttributes( { id: null, slug, theme } );
				} }
			>
				Revert
			</ToolbarButton>
		);
	}
	return null;
}
