/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

export const getEditedPostTemplateId = createRegistrySelector(
	( select ) => () => {
		const {
			id: postId,
			type: postType,
			slug,
		} = select( editorStore ).getCurrentPost();
		const { getSite, getEntityRecords, canUser } = select( coreStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getSite()
			: undefined;
		// First check if the current page is set as the posts page.
		const isPostsPage = +postId === siteSettings?.page_for_posts;
		if ( isPostsPage ) {
			return select( coreStore ).getDefaultTemplateId( { slug: 'home' } );
		}
		const currentTemplate =
			select( editorStore ).getEditedPostAttribute( 'template' );
		if ( currentTemplate ) {
			const templateWithSameSlug = getEntityRecords(
				'postType',
				'wp_template',
				{ per_page: -1 }
			)?.find( ( template ) => template.slug === currentTemplate );
			if ( ! templateWithSameSlug ) {
				return templateWithSameSlug;
			}
			return templateWithSameSlug.id;
		}
		let slugToCheck;
		// In `draft` status we might not have a slug available, so we use the `single`
		// post type templates slug(ex page, single-post, single-product etc..).
		// Pages do not need the `single` prefix in the slug to be prioritized
		// through template hierarchy.
		if ( slug ) {
			slugToCheck =
				postType === 'page'
					? `${ postType }-${ slug }`
					: `single-${ postType }-${ slug }`;
		} else {
			slugToCheck = postType === 'page' ? 'page' : `single-${ postType }`;
		}

		if ( postType ) {
			return select( coreStore ).getDefaultTemplateId( {
				slug: slugToCheck,
			} );
		}
	}
);
