/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

const postTypesWithoutParentTemplate = [
	'wp_template',
	'wp_template_part',
	'wp_block',
	'wp_navigation',
];

export default function useEditedEntityForParams( params ) {
	const { postType, postId } = params;

	const { isRequestingSite, homepageId, url } = useSelect( ( select ) => {
		const { getSite, getUnstableBase } = select( coreDataStore );
		const siteData = getSite();
		const base = getUnstableBase();

		return {
			isRequestingSite: ! base,
			homepageId:
				siteData?.show_on_front === 'page'
					? siteData.page_on_front
					: null,
			url: base?.home,
		};
	}, [] );

	const resolvedTemplateId = useSelect(
		( select ) => {
			// If we're rendering a post type that doesn't have a template
			// no need to resolve its template.
			if ( postTypesWithoutParentTemplate.includes( postType ) ) {
				return undefined;
			}

			const {
				getEditedEntityRecord,
				getEntityRecords,
				getDefaultTemplateId,
				__experimentalGetTemplateForLink,
			} = select( coreDataStore );

			function resolveTemplateForPostTypeAndId(
				postTypeToResolve,
				postIdToResolve
			) {
				const editedEntity = getEditedEntityRecord(
					'postType',
					postTypeToResolve,
					postIdToResolve
				);
				if ( ! editedEntity ) {
					return undefined;
				}
				// First see if the post/page has an assigned template and fetch it.
				const currentTemplateSlug = editedEntity.template;
				if ( currentTemplateSlug ) {
					const currentTemplate = getEntityRecords(
						'postType',
						'wp_template',
						{
							per_page: -1,
						}
					)?.find( ( { slug } ) => slug === currentTemplateSlug );
					if ( currentTemplate ) {
						return currentTemplate.id;
					}
				}

				// If the no template is assigned, use the default template.
				return getDefaultTemplateId(
					postTypeToResolve,
					editedEntity?.slug
				);
			}

			// If we're rendering a specific page, post... we need to resolve its template.
			if ( postType && postId ) {
				return resolveTemplateForPostTypeAndId( postType, postId );
			}

			// If we're rendering the home page, and we have a static home page, resolve its template.
			if ( homepageId ) {
				return resolveTemplateForPostTypeAndId( 'page', homepageId );
			}

			// If we're not rendering a specific page, use the front page template.
			if ( ! isRequestingSite && url ) {
				const template = __experimentalGetTemplateForLink( url );
				return template?.id;
			}
		},
		[ homepageId, isRequestingSite, url, postId, postType ]
	);

	if ( postTypesWithoutParentTemplate.includes( postType ) ) {
		return { isReady: true, postType, postId };
	}

	if ( postType && postId ) {
		return {
			isReady: resolvedTemplateId !== undefined,
			postType: 'wp_template',
			postId: resolvedTemplateId,
			context: { postType, postId },
		};
	}

	if ( homepageId ) {
		return {
			isReady: resolvedTemplateId !== undefined,
			postType: 'wp_template',
			postId: resolvedTemplateId,
			context: { postType: 'page', postId: homepageId },
		};
	}

	if ( ! isRequestingSite ) {
		return {
			isReady: resolvedTemplateId !== undefined,
			postType: 'wp_template',
			postId: resolvedTemplateId,
		};
	}

	return { isReady: false };
}
