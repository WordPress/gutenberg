/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../../actions/utils';

/**
 * Compute the template slug to look up in the template hierarchy.
 *
 * In `draft` status we might not have a slug available, so we use the
 * `single` post type template slug (e.g. page, single-post,
 * single-product, etc.). Pages do not need the `single` prefix to be
 * prioritised through template hierarchy.
 *
 * @param postType The post type.
 * @param slug     The post slug.
 */
export function getTemplateSlugToCheck(
	postType: string,
	slug: string | undefined
): string {
	if ( slug ) {
		return postType === 'page'
			? `${ postType }-${ slug }`
			: `single-${ postType }-${ slug }`;
	}
	return postType === 'page' ? 'page' : `single-${ postType }`;
}

/**
 * Resolve the human-readable label for the default template that would
 * apply to a post, given its type and slug. Meant to be called inside a
 * `useSelect` callback (receives `select` as its first argument).
 *
 * @param select   The `select` function from a `useSelect` callback.
 * @param postType The post type.
 * @param slug     The post slug.
 */
export function getDefaultTemplateLabel(
	select: ( store: typeof coreStore ) => any,
	postType: string | undefined,
	slug: string | undefined
): string {
	if ( ! postType ) {
		return __( 'Default template' );
	}

	const slugToCheck = getTemplateSlugToCheck( postType, slug );

	const templateId = select( coreStore ).getDefaultTemplateId( {
		slug: slugToCheck,
	} );

	if ( ! templateId ) {
		return __( 'Default template' );
	}

	const template = select( coreStore ).getEntityRecord(
		'postType',
		'wp_template',
		templateId
	);

	return template ? getItemTitle( template ) : __( 'Default template' );
}
