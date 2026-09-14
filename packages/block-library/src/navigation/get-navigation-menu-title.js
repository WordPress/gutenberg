import { decodeEntities } from '@wordpress/html-entities';

/**
 * Gets the display title of a Navigation Menu record.
 *
 * Slug references resolve menus from a collection request, whose records carry
 * a `{ rendered, raw }` title, whereas an edited record carries a plain string.
 * This normalizes both shapes.
 *
 * @param {Object|string} [navigationMenu] A Navigation Menu record or its title.
 *
 * @return {string|undefined} The decoded title, if there is one.
 */
export default function getNavigationMenuTitle( navigationMenu ) {
	const title = navigationMenu?.title ?? navigationMenu;

	if ( ! title ) {
		return undefined;
	}

	if ( typeof title === 'string' ) {
		return decodeEntities( title );
	}

	const normalizedTitle = title.raw || title.rendered;

	return normalizedTitle ? decodeEntities( normalizedTitle ) : undefined;
}
