import { createBlock } from '@wordpress/blocks';
import { updateAttributes } from '../../navigation-link/shared/update-attributes';
import { buildNavigationLinkEntityBinding } from '../../navigation-link/shared/use-entity-binding';

/**
 * Creates a Navigation Link block for an item picked in the bulk add modal,
 * with the attributes the link UI would set for the same link suggestion.
 *
 * @param {Object}  link       The picked link.
 * @param {string}  link.title Link text, not escaped.
 * @param {string}  link.url   Link URL.
 * @param {string}  link.kind  `post-type`, `taxonomy`, `post-type-archive` or `custom`.
 * @param {string}  link.type  Post type, `category`, `tag` or `custom`.
 * @param {?number} link.id    Post or term id, for entity links.
 * @return {Object} The block.
 */
export function createMenuLinkBlock( { title, url, kind, type, id } ) {
	const { attributes, isEntityLink } = updateAttributes(
		{ title, url, kind, type, id },
		() => {},
		{}
	);

	// Entity links keep their URL in sync with the linked post or term, as
	// they do when added through the link UI (see `useHandleLinkChange`).
	if (
		isEntityLink &&
		( attributes.kind === 'post-type' || attributes.kind === 'taxonomy' )
	) {
		attributes.metadata = {
			bindings: buildNavigationLinkEntityBinding( attributes.kind ),
		};
	}

	return createBlock( 'core/navigation-link', attributes );
}

/**
 * Returns the keys identifying a link, used to tell whether an item is
 * already in a menu.
 *
 * @param {Object}  attributes      Link attributes.
 * @param {string}  attributes.kind Link kind.
 * @param {string}  attributes.type Link type.
 * @param {?number} attributes.id   Post or term id.
 * @param {string}  attributes.url  Link URL.
 * @return {string[]} Keys.
 */
export function getLinkKeys( { kind, type, id, url } ) {
	const keys = [];
	if ( kind && kind !== 'custom' && type && id ) {
		keys.push( `${ kind }:${ type }:${ id }` );
	}
	if ( url ) {
		keys.push( `url:${ url }` );
	}
	return keys;
}
