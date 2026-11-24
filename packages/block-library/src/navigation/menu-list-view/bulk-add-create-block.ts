import { createBlock } from '@wordpress/blocks';
import { updateAttributes } from '../../navigation-link/shared/update-attributes';
import { buildNavigationLinkEntityBinding } from '../../navigation-link/shared/use-entity-binding';

/**
 * A link picked in the bulk add modal.
 */
export interface MenuLink {
	/** Link text, not escaped. */
	title: string;
	/** Link URL. */
	url?: string;
	/** `post-type`, `taxonomy`, `post-type-archive` or `custom`. */
	kind: string;
	/** Post type, `category`, `tag` or `custom`. */
	type?: string;
	/** Post or term id, for entity links. */
	id?: number | null;
}

/**
 * Creates a Navigation Link block for an item picked in the bulk add modal,
 * with the attributes the link UI would set for the same link suggestion.
 *
 * @param link       The picked link.
 * @param link.title Link text, not escaped.
 * @param link.url   Link URL.
 * @param link.kind  `post-type`, `taxonomy`, `post-type-archive` or `custom`.
 * @param link.type  Post type, `category`, `tag` or `custom`.
 * @param link.id    Post or term id, for entity links.
 * @return The block.
 */
export function createMenuLinkBlock( {
	title,
	url,
	kind,
	type,
	id,
}: MenuLink ) {
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

export interface LinkKeyAttributes {
	kind?: string;
	type?: string;
	id?: number | null;
	url?: string;
}

/**
 * Returns the keys identifying a link, used to tell whether an item is
 * already in a menu.
 *
 * @param attributes      Link attributes.
 * @param attributes.kind Link kind.
 * @param attributes.type Link type.
 * @param attributes.id   Post or term id.
 * @param attributes.url  Link URL.
 * @return Keys.
 */
export function getLinkKeys( {
	kind,
	type,
	id,
	url,
}: LinkKeyAttributes ): string[] {
	const keys: string[] = [];
	if ( kind && kind !== 'custom' && type && id ) {
		keys.push( `${ kind }:${ type }:${ id }` );
	}
	if ( url ) {
		keys.push( `url:${ url }` );
	}
	return keys;
}
