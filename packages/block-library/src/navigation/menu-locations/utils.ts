import { parse } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
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

/**
 * A block, as parsed from a template part or kept in its edits.
 */
export type MenuLocationBlock = Block< Record< string, any > >;

/**
 * A template part record, with its unsaved edits. Untyped in core-data.
 */
export type TemplatePartRecord = Record< string, any >;

/**
 * A Navigation Menu (`wp_navigation`) record.
 */
export interface NavigationMenuRecord {
	id: number;
	status?: string;
	title?: string | { rendered?: string; raw?: string };
	[ key: string ]: any;
}

/**
 * A template part with a Navigation block in it, and the menus it shows.
 */
export interface NavigationLocation {
	id: string;
	part: TemplatePartRecord;
	area: string;
	title: string;
	menuIds: number[];
	usesFallback: boolean;
}

const EMPTY_ARRAY: never[] = [];

/*
 * Parsing every template part on each change would be slow, so blocks are
 * kept by the content they were parsed from.
 */
const parsedContentCache = new Map< string, MenuLocationBlock[] >();

function parseContent( content?: string ): MenuLocationBlock[] {
	if ( ! content ) {
		return EMPTY_ARRAY;
	}

	if ( ! parsedContentCache.has( content ) ) {
		parsedContentCache.set(
			content,
			parse( content, { __unstableSkipMigrationLogs: true } )
		);
	}

	return parsedContentCache.get( content )!;
}

/**
 * A template part's blocks, with its unsaved edits.
 *
 * @param part Edited template part record.
 * @return Its blocks.
 */
export function getTemplatePartBlocks(
	part: TemplatePartRecord | null | undefined
): MenuLocationBlock[] {
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
 * @param blocks Blocks to search.
 * @return Navigation blocks.
 */
export function findNavigationBlocks(
	blocks: MenuLocationBlock[] | null | undefined
): MenuLocationBlock[] {
	const found: MenuLocationBlock[] = [];

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
 * @param block          Navigation block.
 * @param fallbackMenuId The menu shown when no menu is chosen.
 * @return The menu's ID, or null if the block has its own links.
 */
export function getShownMenuId(
	block: MenuLocationBlock,
	fallbackMenuId: number | null | undefined
): number | null {
	const ref = Number( block.attributes?.ref );

	if ( ref ) {
		return ref;
	}

	if (
		! block.innerBlocks?.length &&
		! block.attributes?.noFallback &&
		fallbackMenuId
	) {
		return Number( fallbackMenuId );
	}

	return null;
}

/**
 * The menu WordPress shows in a Navigation block that hasn't chosen one: the
 * most recently published menu.
 *
 * @param menus Menus, most recent first.
 * @return The fallback menu's ID.
 */
export function getFallbackMenuId(
	menus: NavigationMenuRecord[] | null | undefined
): number | null {
	return (
		( menus || EMPTY_ARRAY ).find(
			( menu: NavigationMenuRecord ) => menu.status === 'publish'
		)?.id ?? null
	);
}

function getAreaOrder( area: string ) {
	const order = [
		'header',
		'footer',
		NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
	].indexOf( area );

	return order === -1 ? 3 : order;
}

export function getTemplatePartTitle(
	part: TemplatePartRecord | null | undefined
): string {
	const title =
		typeof part?.title === 'string'
			? part.title
			: part?.title?.rendered || part?.title?.raw;

	return title ? decodeEntities( title ) : part?.slug || '';
}

export function getAreaLabel( area: string ): string {
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
 * @param templateParts  Edited template part records.
 * @param fallbackMenuId The menu shown when no menu is chosen.
 * @return `{ id, part, area, title, menuIds, usesFallback }`.
 */
export function getNavigationLocations(
	templateParts: TemplatePartRecord[] | null | undefined,
	fallbackMenuId: number | null | undefined
): NavigationLocation[] {
	return ( templateParts || EMPTY_ARRAY )
		.map( ( part: TemplatePartRecord ): NavigationLocation | null => {
			const navigationBlocks = findNavigationBlocks(
				getTemplatePartBlocks( part )
			);

			if ( ! navigationBlocks.length ) {
				return null;
			}

			const menuIds: number[] = [];
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
		.filter( ( location ): location is NavigationLocation =>
			Boolean( location )
		)
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
 * @param blocks            Blocks to change.
 * @param isMatch           Whether a Navigation block should change.
 * @param newMenuId         The menu to show.
 * @param options
 * @param options.onlyFirst Change the first match only.
 * @return The changed blocks.
 */
export function setNavigationMenu(
	blocks: MenuLocationBlock[],
	isMatch: ( block: MenuLocationBlock ) => boolean,
	newMenuId: number | null | undefined,
	{ onlyFirst = false }: { onlyFirst?: boolean } = {}
): MenuLocationBlock[] {
	let hasChanged = false;

	function visit( list: MenuLocationBlock[] ): MenuLocationBlock[] {
		return list.map( ( block ) => {
			if ( onlyFirst && hasChanged ) {
				return block;
			}

			if ( block.name === 'core/navigation' && isMatch( block ) ) {
				hasChanged = true;
				const attributes: Record< string, any > = {
					...block.attributes,
					ref: newMenuId,
				};
				if ( newMenuId ) {
					delete attributes.noFallback;
				} else {
					// No menu here, rather than the site's fallback menu.
					delete attributes.ref;
					attributes.noFallback = true;
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

export const PREVIEW_CURRENT_MENU_CLASS = 'menu-locations__current-menu';
export const PREVIEW_OTHER_MENU_CLASS = 'menu-locations__other-menu';

function addClassName( attributes: Record< string, any >, className: string ) {
	return {
		...attributes,
		className: [ attributes?.className, className ]
			.filter( Boolean )
			.join( ' ' ),
	};
}

/**
 * A template part's blocks, ready to preview: an overlay's Navigation blocks
 * never collapse into a menu button of their own, as the site renders them.
 * Given a menu, and when the part has more than one Navigation block, the
 * blocks showing the menu and the others are marked with
 * `PREVIEW_CURRENT_MENU_CLASS` and `PREVIEW_OTHER_MENU_CLASS`, so the preview
 * can tell them apart.
 *
 * @param location       Location from `getNavigationLocations`.
 * @param menuId         The menu to mark, if any.
 * @param fallbackMenuId The menu shown when no menu is chosen.
 * @return Blocks to preview.
 */
export function getPreviewBlocks(
	location: NavigationLocation,
	menuId?: number,
	fallbackMenuId?: number | null
): MenuLocationBlock[] {
	const blocks = getTemplatePartBlocks( location.part );
	const isOverlay = location.area === NAVIGATION_OVERLAY_TEMPLATE_PART_AREA;
	const shouldMark =
		menuId !== undefined && findNavigationBlocks( blocks ).length > 1;

	if ( ! isOverlay && ! shouldMark ) {
		return blocks;
	}

	function visit( list: MenuLocationBlock[] ): MenuLocationBlock[] {
		return list.map( ( block ) => {
			if ( block.name !== 'core/navigation' ) {
				return {
					...block,
					innerBlocks: visit( block.innerBlocks || EMPTY_ARRAY ),
				};
			}
			let attributes = block.attributes;
			if ( isOverlay ) {
				attributes = { ...attributes, overlayMenu: 'never' };
			}
			if ( shouldMark ) {
				attributes = addClassName(
					attributes,
					showsMenu( block, menuId!, fallbackMenuId )
						? PREVIEW_CURRENT_MENU_CLASS
						: PREVIEW_OTHER_MENU_CLASS
				);
			}
			return { ...block, attributes };
		} );
	}

	return visit( blocks );
}

/**
 * Says where a menu is used, for the menus list.
 *
 * @param locations The menu's locations.
 * @return "Used in 2 locations" or "Not used".
 */
export function getWhereUsedLabel(
	locations: NavigationLocation[] | null | undefined
): string {
	const count = new Set(
		( locations ?? EMPTY_ARRAY ).map(
			( location: NavigationLocation ) => location.id
		)
	).size;

	if ( ! count ) {
		return __( 'Not used' );
	}

	return sprintf(
		/* translators: %d: Number of places a menu is used. */
		_n( 'Used in %d location', 'Used in %d locations', count ),
		count
	);
}

export function getMenuTitle(
	menu: NavigationMenuRecord | null | undefined
): string {
	const title =
		typeof menu?.title === 'string'
			? menu.title
			: menu?.title?.rendered || menu?.title?.raw;

	return title
		? decodeEntities( title )
		: /* translators: %d: menu ID. */
			sprintf( __( '(no title %d)' ), menu?.id as number );
}

/**
 * Whether a Navigation block shows a menu, by choice or because it is the
 * site's fallback.
 *
 * @param block          Navigation block.
 * @param menuId         The menu's ID.
 * @param fallbackMenuId The menu shown when no menu is chosen.
 * @return Whether the block shows the menu.
 */
export function showsMenu(
	block: MenuLocationBlock,
	menuId: number | string,
	fallbackMenuId: number | null | undefined
): boolean {
	return getShownMenuId( block, fallbackMenuId ) === Number( menuId );
}

/**
 * What a location shows now, in the Navigation block a new menu would
 * replace (the first one). Used to warn before replacing another menu.
 *
 * @param location       A location from `getNavigationLocations`.
 * @param navigationId   The menu about to be shown there.
 * @param menus          Every menu.
 * @param fallbackMenuId The menu shown when no menu is chosen.
 * @return What would be replaced, or null if nothing would.
 */
export function getReplacedMenu(
	location: NavigationLocation,
	navigationId: number | string,
	menus: NavigationMenuRecord[] | null | undefined,
	fallbackMenuId: number | null | undefined
): { title: string; isOwnLinks: boolean } | null {
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
			( record: NavigationMenuRecord ) => record.id === shownId
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
