/**
 * WordPress dependencies
 */
import { createSelector, createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	canUser,
	getDefaultTemplateId,
	getEntityRecord,
	type State,
} from './selectors';
import { STORE_NAME } from './name';
import { unlock } from './lock-unlock';

type EntityRecordKey = string | number;

/**
 * Returns the previous edit from the current undo offset
 * for the entity records edits history, if any.
 *
 * @param state State tree.
 *
 * @return The undo manager.
 */
export function getUndoManager( state: State ) {
	return state.undoManager;
}

/**
 * Retrieve the fallback Navigation.
 *
 * @param state Data state.
 * @return The ID for the fallback Navigation post.
 */
export function getNavigationFallbackId(
	state: State
): EntityRecordKey | undefined {
	return state.navigationFallbackId;
}

export const getBlockPatternsForPostType = createRegistrySelector(
	( select: any ) =>
		createSelector(
			( state, postType ) =>
				select( STORE_NAME )
					.getBlockPatterns()
					.filter(
						( { postTypes } ) =>
							! postTypes ||
							( Array.isArray( postTypes ) &&
								postTypes.includes( postType ) )
					),
			() => [ select( STORE_NAME ).getBlockPatterns() ]
		)
);

/**
 * Returns the entity records permissions for the given entity record ids.
 */
export const getEntityRecordsPermissions = createRegistrySelector( ( select ) =>
	createSelector(
		(
			state: State,
			kind: string,
			name: string,
			ids: string | string[]
		) => {
			const normalizedIds = Array.isArray( ids ) ? ids : [ ids ];
			return normalizedIds.map( ( id ) => ( {
				delete: select( STORE_NAME ).canUser( 'delete', {
					kind,
					name,
					id,
				} ),
				update: select( STORE_NAME ).canUser( 'update', {
					kind,
					name,
					id,
				} ),
			} ) );
		},
		( state ) => [ state.userPermissions ]
	)
);

/**
 * Returns the entity record permissions for the given entity record id.
 *
 * @param state Data state.
 * @param kind  Entity kind.
 * @param name  Entity name.
 * @param id    Entity record id.
 *
 * @return The entity record permissions.
 */
export function getEntityRecordPermissions(
	state: State,
	kind: string,
	name: string,
	id: string
) {
	return getEntityRecordsPermissions( state, kind, name, id )[ 0 ];
}

/**
 * Returns the registered post meta fields for a given post type.
 *
 * @param state    Data state.
 * @param postType Post type.
 *
 * @return Registered post meta fields.
 */
export function getRegisteredPostMeta( state: State, postType: string ) {
	return state.registeredPostMeta?.[ postType ] ?? {};
}

function normalizePageId( value: number | string | undefined ): string | null {
	if ( ! value || ! [ 'number', 'string' ].includes( typeof value ) ) {
		return null;
	}

	// We also need to check if it's not zero (`'0'`).
	if ( Number( value ) === 0 ) {
		return null;
	}

	return value.toString();
}

interface SiteData {
	show_on_front?: string;
	page_on_front?: string | number;
	page_for_posts?: string | number;
}

export const getHomePage = createRegistrySelector( ( select ) =>
	createSelector(
		() => {
			const canReadSiteData = select( STORE_NAME ).canUser( 'read', {
				kind: 'root',
				name: 'site',
			} );
			if ( ! canReadSiteData ) {
				return null;
			}
			const siteData = select( STORE_NAME ).getEntityRecord(
				'root',
				'site'
			) as SiteData | undefined;
			if ( ! siteData ) {
				return null;
			}
			const homepageId =
				siteData?.show_on_front === 'page'
					? normalizePageId( siteData.page_on_front )
					: null;
			if ( homepageId ) {
				return { postType: 'page', postId: homepageId };
			}
			const frontPageTemplateId = select(
				STORE_NAME
			).getDefaultTemplateId( {
				slug: 'front-page',
			} );
			return { postType: 'wp_template', postId: frontPageTemplateId };
		},
		( state ) => [
			canUser( state, 'read', {
				kind: 'root',
				name: 'site',
			} ) && getEntityRecord( state, 'root', 'site' ),
			getDefaultTemplateId( state, {
				slug: 'front-page',
			} ),
		]
	)
);

export const getPostsPageId = createRegistrySelector( ( select ) => () => {
	const canReadSiteData = select( STORE_NAME ).canUser( 'read', {
		kind: 'root',
		name: 'site',
	} );
	if ( ! canReadSiteData ) {
		return null;
	}
	const siteData = select( STORE_NAME ).getEntityRecord( 'root', 'site' ) as
		| SiteData
		| undefined;
	return siteData?.show_on_front === 'page'
		? normalizePageId( siteData.page_for_posts )
		: null;
} );

export const getTemplateId = createRegistrySelector(
	( select ) => ( state, postType, postId ) => {
		const homepage = unlock( select( STORE_NAME ) ).getHomePage();

		if ( ! homepage ) {
			return;
		}

		// For the front page, we always use the front page template if existing.
		if (
			postType === 'page' &&
			postType === homepage?.postType &&
			postId.toString() === homepage?.postId
		) {
			// The /lookup endpoint cannot currently handle a lookup
			// when a page is set as the front page, so specifically in
			// that case, we want to check if there is a front page
			// template, and instead of falling back to the home
			// template, we want to fall back to the page template.
			const templates = select( STORE_NAME ).getEntityRecords(
				'postType',
				'wp_template',
				{
					per_page: -1,
				}
			);
			if ( ! templates ) {
				return;
			}
			const id = templates.find( ( { slug } ) => slug === 'front-page' )
				?.id;
			if ( id ) {
				return id;
			}
			// If no front page template is found, continue with the
			// logic below (fetching the page template).
		}

		const editedEntity = select( STORE_NAME ).getEditedEntityRecord(
			'postType',
			postType,
			postId
		);
		if ( ! editedEntity ) {
			return;
		}
		const postsPageId = unlock( select( STORE_NAME ) ).getPostsPageId();
		// Check if the current page is the posts page.
		if ( postType === 'page' && postsPageId === postId.toString() ) {
			return select( STORE_NAME ).getDefaultTemplateId( {
				slug: 'home',
			} );
		}
		// First see if the post/page has an assigned template and fetch it.
		const currentTemplateSlug = editedEntity.template;
		if ( currentTemplateSlug ) {
			const currentTemplate = select( STORE_NAME )
				.getEntityRecords( 'postType', 'wp_template', {
					per_page: -1,
				} )
				?.find( ( { slug } ) => slug === currentTemplateSlug );
			if ( currentTemplate ) {
				return currentTemplate.id;
			}
		}
		// If no template is assigned, use the default template.
		let slugToCheck;
		// In `draft` status we might not have a slug available, so we use the `single`
		// post type templates slug(ex page, single-post, single-product etc..).
		// Pages do not need the `single` prefix in the slug to be prioritized
		// through template hierarchy.
		if ( editedEntity.slug ) {
			slugToCheck =
				postType === 'page'
					? `${ postType }-${ editedEntity.slug }`
					: `single-${ postType }-${ editedEntity.slug }`;
		} else {
			slugToCheck = postType === 'page' ? 'page' : `single-${ postType }`;
		}
		return select( STORE_NAME ).getDefaultTemplateId( {
			slug: slugToCheck,
		} );
	}
);
