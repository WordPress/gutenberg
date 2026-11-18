import { parse } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _x, sprintf } from '@wordpress/i18n';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';

export const TEMPLATE_PART_POST_TYPE = 'wp_template_part';
export const NAVIGATION_POST_TYPE = 'wp_navigation';

/**
 * Asked for with the same object everywhere, so core-data fetches the
 * template parts once for every screen that shows where menus are used.
 */
export const TEMPLATE_PARTS_QUERY = { per_page: -1 };

export const AREA_FILTERS = {
	all: 'all',
	header: 'header',
	footer: 'footer',
	overlay: NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
};

const EMPTY_ARRAY = [];

/*
 * Parsing every template part on each change would be slow, so blocks are
 * kept by the content they were parsed from.
 */
const parsedContentCache = new Map();

function parseContent( content ) {
	if ( ! content ) {
		return EMPTY_ARRAY;
	}

	if ( ! parsedContentCache.has( content ) ) {
		parsedContentCache.set(
			content,
			parse( content, { __unstableSkipMigrationLogs: true } )
		);
	}

	return parsedContentCache.get( content );
}

/**
 * A template part's blocks, with its unsaved edits.
 *
 * @param {Object} part Edited template part record.
 * @return {Object[]} Its blocks.
 */
export function getTemplatePartBlocks( part ) {
	if ( Array.isArray( part?.blocks ) ) {
		return part.blocks;
	}

	const content =
		typeof part?.content === 'string' ? part.content : part?.content?.raw;

	return parseContent( content );
}

/**
 * Every Navigation block in a tree, in document order.
 *
 * @param {Object[]} blocks Blocks to search.
 * @return {Object[]} Navigation blocks.
 */
export function findNavigationBlocks( blocks ) {
	const found = [];

	for ( const block of blocks || EMPTY_ARRAY ) {
		if ( block.name === 'core/navigation' ) {
			found.push( block );
		}

		if ( block.innerBlocks?.length ) {
			found.push( ...findNavigationBlocks( block.innerBlocks ) );
		}
	}

	return found;
}

/**
 * The menu a Navigation block shows. A block that points at no menu and has
 * no links of its own shows the site's fallback menu, as it does on the
 * front of the site.
 *
 * @param {Object}  block          Navigation block.
 * @param {?number} fallbackMenuId The menu shown when no menu is chosen.
 * @return {?number} The menu's ID, or null if the block has its own links.
 */
export function getShownMenuId( block, fallbackMenuId ) {
	const ref = Number( block.attributes?.ref );

	if ( ref ) {
		return ref;
	}

	if ( ! block.innerBlocks?.length && fallbackMenuId ) {
		return Number( fallbackMenuId );
	}

	return null;
}

/**
 * The menu WordPress shows in a Navigation block that hasn't chosen one: the
 * most recently published menu.
 *
 * @param {Object[]} menus Menus, most recent first.
 * @return {?number} The fallback menu's ID.
 */
export function getFallbackMenuId( menus ) {
	return (
		( menus || EMPTY_ARRAY ).find( ( menu ) => menu.status === 'publish' )
			?.id ?? null
	);
}

function getAreaOrder( area ) {
	const order = [
		'header',
		'footer',
		NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
	].indexOf( area );

	return order === -1 ? 3 : order;
}

export function getTemplatePartTitle( part ) {
	const title =
		typeof part?.title === 'string'
			? part.title
			: part?.title?.rendered || part?.title?.raw;

	return title ? decodeEntities( title ) : part?.slug || '';
}

export function getAreaLabel( area ) {
	switch ( area ) {
		case 'header':
			return __( 'Header' );
		case 'footer':
			return __( 'Footer' );
		case NAVIGATION_OVERLAY_TEMPLATE_PART_AREA:
			return __( 'Overlay' );
		default:
			return __( 'General' );
	}
}

/**
 * Every template part with a Navigation block in it, and the menus each
 * shows, sorted headers first, then footers, then overlays.
 *
 * @param {Object[]} templateParts  Edited template part records.
 * @param {?number}  fallbackMenuId The menu shown when no menu is chosen.
 * @return {Object[]} `{ id, part, area, title, menuIds, usesFallback }`.
 */
export function getNavigationLocations( templateParts, fallbackMenuId ) {
	return ( templateParts || EMPTY_ARRAY )
		.map( ( part ) => {
			const navigationBlocks = findNavigationBlocks(
				getTemplatePartBlocks( part )
			);

			if ( ! navigationBlocks.length ) {
				return null;
			}

			const menuIds = [];
			let usesFallback = false;

			for ( const block of navigationBlocks ) {
				const menuId = getShownMenuId( block, fallbackMenuId );

				if ( menuId && ! menuIds.includes( menuId ) ) {
					menuIds.push( menuId );
				}

				if ( ! Number( block.attributes?.ref ) && menuId ) {
					usesFallback = true;
				}
			}

			return {
				id: part.id,
				part,
				area: part.area || 'uncategorized',
				title: getTemplatePartTitle( part ),
				menuIds,
				usesFallback,
			};
		} )
		.filter( Boolean )
		.sort(
			( a, b ) =>
				getAreaOrder( a.area ) - getAreaOrder( b.area ) ||
				a.title.localeCompare( b.title )
		);
}

/**
 * Point Navigation blocks at another menu. Returns new blocks, leaving the
 * ones passed in untouched, so they can be handed to `editEntityRecord`.
 *
 * @param {Object[]} blocks            Blocks to change.
 * @param {Function} isMatch           Whether a Navigation block should change.
 * @param {number}   newMenuId         The menu to show.
 * @param {Object}   options
 * @param {boolean}  options.onlyFirst Change the first match only.
 * @return {Object[]} The changed blocks.
 */
export function setNavigationMenu(
	blocks,
	isMatch,
	newMenuId,
	{ onlyFirst = false } = {}
) {
	let hasChanged = false;

	function visit( list ) {
		return list.map( ( block ) => {
			if ( onlyFirst && hasChanged ) {
				return block;
			}

			if ( block.name === 'core/navigation' && isMatch( block ) ) {
				hasChanged = true;
				const attributes = { ...block.attributes, ref: newMenuId };
				if ( ! newMenuId ) {
					// No menu chosen: the site shows its newest menu here.
					delete attributes.ref;
				}
				return {
					...block,
					attributes,
					// The menu's links come from the menu now.
					innerBlocks: [],
				};
			}

			if ( ! block.innerBlocks?.length ) {
				return block;
			}

			const innerBlocks = visit( block.innerBlocks );

			return innerBlocks.some(
				( innerBlock, index ) =>
					innerBlock !== block.innerBlocks[ index ]
			)
				? { ...block, innerBlocks }
				: block;
		} );
	}

	return visit( blocks );
}

/**
 * A template part's blocks, ready to preview: an overlay's Navigation blocks
 * never collapse into a menu button of their own, as the site renders them.
 *
 * @param {Object} location Location from `getNavigationLocations`.
 * @return {Object[]} Blocks to preview.
 */
export function getPreviewBlocks( location ) {
	const blocks = getTemplatePartBlocks( location.part );

	if ( location.area !== NAVIGATION_OVERLAY_TEMPLATE_PART_AREA ) {
		return blocks;
	}

	function visit( list ) {
		return list.map( ( block ) => ( {
			...block,
			attributes:
				block.name === 'core/navigation'
					? { ...block.attributes, overlayMenu: 'never' }
					: block.attributes,
			innerBlocks: visit( block.innerBlocks || EMPTY_ARRAY ),
		} ) );
	}

	return visit( blocks );
}

/**
 * Says where a menu is used, for the menus list.
 *
 * @param {Object[]} locations The menu's locations.
 * @return {string} "Used in Header, Footer" or "Not used".
 */
export function getWhereUsedLabel( locations ) {
	if ( ! locations?.length ) {
		return __( 'Not used' );
	}

	const titles = [
		...new Set( locations.map( ( location ) => location.title ) ),
	];
	// translators: Separates the names in a list, like "Header, Footer".
	const shown = titles
		.slice( 0, 3 )
		.join( `${ _x( ',', 'list separator' ) } ` );

	if ( titles.length > 3 ) {
		return sprintf(
			/* translators: 1: Comma-separated names of places a menu is used, like "Header, Footer". 2: How many more places it is used. */
			__( 'Used in %1$s and %2$d more' ),
			shown,
			titles.length - 3
		);
	}

	return sprintf(
		/* translators: %s: Comma-separated names of places a menu is used, like "Header, Footer". */
		__( 'Used in %s' ),
		shown
	);
}

export function getMenuTitle( menu ) {
	const title =
		typeof menu?.title === 'string'
			? menu.title
			: menu?.title?.rendered || menu?.title?.raw;

	return title
		? decodeEntities( title )
		: /* translators: %d: menu ID. */
			sprintf( __( '(no title %d)' ), menu?.id );
}

/**
 * Whether a Navigation block shows a menu, by choice or because it is the
 * site's fallback.
 *
 * @param {Object}  block          Navigation block.
 * @param {number}  menuId         The menu's ID.
 * @param {?number} fallbackMenuId The menu shown when no menu is chosen.
 * @return {boolean} Whether the block shows the menu.
 */
export function showsMenu( block, menuId, fallbackMenuId ) {
	return getShownMenuId( block, fallbackMenuId ) === Number( menuId );
}

/**
 * What a place shows once a menu is removed from it. Removing the menu
 * leaves no menu chosen there, which shows the site's newest menu, as the
 * front of the site does. When that is the menu being removed, the newest
 * other menu is chosen instead, so the menu really goes.
 *
 * @param {Object[]} menus  Menus, most recent first.
 * @param {number}   menuId The menu being removed.
 * @return {?Object} `{ newMenuId, shownMenu, isFallback }`, or null when there
 *                   is no other menu to show.
 */
export function getRemovalOutcome( menus, menuId ) {
	const id = Number( menuId );
	const fallbackMenuId = getFallbackMenuId( menus );

	if ( fallbackMenuId && fallbackMenuId !== id ) {
		return {
			newMenuId: null,
			shownMenu: menus.find( ( menu ) => menu.id === fallbackMenuId ),
			isFallback: true,
		};
	}

	const replacement = ( menus || EMPTY_ARRAY ).find(
		( menu ) => menu.id !== id && menu.status === 'publish'
	);

	return replacement
		? {
				newMenuId: replacement.id,
				shownMenu: replacement,
				isFallback: false,
			}
		: null;
}

/**
 * What a location shows now, in the Navigation block a new menu would
 * replace (the first one). Used to warn before replacing another menu.
 *
 * @param {Object}   location       A location from `getNavigationLocations`.
 * @param {number}   navigationId   The menu about to be shown there.
 * @param {Object[]} menus          Every menu.
 * @param {?number}  fallbackMenuId The menu shown when no menu is chosen.
 * @return {?{ title: string, isOwnLinks: boolean }} What would be replaced,
 *                                                  or null if nothing would.
 */
export function getReplacedMenu(
	location,
	navigationId,
	menus,
	fallbackMenuId
) {
	const [ block ] = findNavigationBlocks(
		getTemplatePartBlocks( location.part )
	);

	if ( ! block ) {
		return null;
	}

	const shownId = getShownMenuId( block, fallbackMenuId );

	if ( shownId === Number( navigationId ) ) {
		return null;
	}

	if ( shownId ) {
		const menu = ( menus || EMPTY_ARRAY ).find(
			( record ) => record.id === shownId
		);
		return {
			title: menu ? getMenuTitle( menu ) : __( 'Another menu' ),
			isOwnLinks: false,
		};
	}

	if ( block.innerBlocks?.length ) {
		return { title: __( 'Its own links' ), isOwnLinks: true };
	}

	return null;
}
