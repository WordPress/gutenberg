/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
// @ts-expect-error - No type declarations available for @wordpress/blocks.
import { parse, serialize } from '@wordpress/blocks';

type ParsedBlock = {
	name?: string;
	attributes?: {
		ref?: number | string;
		__unstableLocation?: string;
	};
	innerBlocks?: ParsedBlock[];
};

export type TemplatePartRecord = {
	id: string | number;
	slug?: string;
	area?: string;
	status?: string;
	title?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
	description?: string;
	content?:
		| string
		| {
				raw?: string;
				rendered?: string;
		  };
	blocks?: unknown[];
};

export type NavigationLocation = {
	id: string;
	label: string;
	part: TemplatePartRecord;
};

export type NavigationLocationsMap = Record< number, NavigationLocation[] >;

export type TemplatePartMenuRef = {
	part: TemplatePartRecord;
	menuIds: number[];
};

const EXPLICITLY_UNASSIGNED_NAVIGATION_LOCATION = 'rsm-unassigned';

function getTemplatePartAreaPriority( part: TemplatePartRecord ) {
	switch ( part.area ) {
		case 'header':
			return 0;
		case 'footer':
			return 1;
		default:
			return 2;
	}
}

export function compareTemplatePartsByArea(
	firstPart: TemplatePartRecord,
	secondPart: TemplatePartRecord
) {
	return (
		getTemplatePartAreaPriority( firstPart ) -
		getTemplatePartAreaPriority( secondPart )
	);
}

export function getTemplatePartTitle( part: TemplatePartRecord ) {
	const title =
		typeof part.title === 'string'
			? part.title
			: part.title?.rendered || part.title?.raw;

	return title ? decodeEntities( title ) : '';
}

export function getLocationLabel( part: TemplatePartRecord ) {
	const title = getTemplatePartTitle( part );

	if ( title ) {
		return title;
	}

	switch ( part.area ) {
		case 'header':
			return __( 'Header' );
		case 'footer':
			return __( 'Footer' );
		case 'sidebar':
			return __( 'Side area' );
	}

	return getTemplatePartTitle( part ) || __( 'Site area' );
}

export function getLocationsSummary( locations: NavigationLocation[] ) {
	if ( locations.length === 0 ) {
		return __( 'Not used' );
	}

	return sprintf(
		/* translators: %d: Number of locations where this navigation menu is shown. */
		_n( '%d location', '%d locations', locations.length ),
		locations.length
	);
}

export function getTemplatePartRawContent(
	part: TemplatePartRecord,
	editedContent?: string | { raw?: string }
) {
	if ( editedContent ) {
		return typeof editedContent === 'string'
			? editedContent
			: editedContent.raw;
	}

	return typeof part.content === 'string' ? part.content : part.content?.raw;
}

function isNavigationBlock( block: ParsedBlock ) {
	return block.name === 'core/navigation';
}

function hasNavigationBlockInTree( blocks: ParsedBlock[] ) {
	const stack = [ ...blocks ];

	while ( stack.length ) {
		const { innerBlocks = [], ...block } = stack.shift() ?? {};

		if ( innerBlocks.length ) {
			stack.unshift( ...innerBlocks );
		}

		if ( isNavigationBlock( block ) ) {
			return true;
		}
	}

	return false;
}

function assignFirstNavigationBlockRef(
	blocks: ParsedBlock[],
	navigationId: number
) {
	for ( const block of blocks ) {
		if ( isNavigationBlock( block ) ) {
			const attributes = { ...( block.attributes ?? {} ) };
			delete attributes.__unstableLocation;

			block.attributes = {
				...attributes,
				ref: navigationId,
			};

			return true;
		}

		if (
			block.innerBlocks?.length &&
			assignFirstNavigationBlockRef( block.innerBlocks, navigationId )
		) {
			return true;
		}
	}

	return false;
}

function markFirstNavigationBlockAsUnassigned( blocks: ParsedBlock[] ) {
	for ( const block of blocks ) {
		if ( isNavigationBlock( block ) ) {
			const { ref, ...attributes } = block.attributes ?? {};

			// A Navigation block without a ref can fall back to a menu
			// automatically. Marking it as explicitly unassigned lets this
			// editor UI distinguish "no menu here" from "use the fallback".
			block.attributes = {
				...attributes,
				__unstableLocation: EXPLICITLY_UNASSIGNED_NAVIGATION_LOCATION,
			};

			return true;
		}

		if (
			block.innerBlocks?.length &&
			markFirstNavigationBlockAsUnassigned( block.innerBlocks )
		) {
			return true;
		}
	}

	return false;
}

function removeNavigationBlockRef(
	blocks: ParsedBlock[],
	navigationId: number
) {
	for ( const block of blocks ) {
		if (
			isNavigationBlock( block ) &&
			Number( block.attributes?.ref ) === navigationId
		) {
			const { ref, ...attributes } = block.attributes ?? {};

			block.attributes = {
				...attributes,
				__unstableLocation: EXPLICITLY_UNASSIGNED_NAVIGATION_LOCATION,
			};

			return true;
		}

		if (
			block.innerBlocks?.length &&
			removeNavigationBlockRef( block.innerBlocks, navigationId )
		) {
			return true;
		}
	}

	return false;
}

function getReferencedMenuIds(
	blocks: ParsedBlock[],
	fallbackMenuId?: number
): number[] {
	const menuIds: number[] = [];
	const stack = [ ...blocks ];

	while ( stack.length ) {
		const { innerBlocks = [], ...block } = stack.shift() ?? {};

		if ( innerBlocks.length ) {
			stack.unshift( ...innerBlocks );
		}

		if ( block.name !== 'core/navigation' ) {
			continue;
		}

		if (
			block.attributes?.__unstableLocation ===
			EXPLICITLY_UNASSIGNED_NAVIGATION_LOCATION
		) {
			continue;
		}

		if ( block.attributes?.ref ) {
			const menuId = Number( block.attributes.ref );

			if ( Number.isFinite( menuId ) ) {
				menuIds.push( menuId );
			}
			continue;
		}

		if ( ! innerBlocks.length && fallbackMenuId ) {
			menuIds.push( fallbackMenuId );
		}
	}

	return menuIds;
}

export function templatePartHasNavigationBlock(
	part: TemplatePartRecord,
	editedContent?: string | { raw?: string }
) {
	const rawContent = getTemplatePartRawContent( part, editedContent );

	if ( ! rawContent ) {
		return false;
	}

	return hasNavigationBlockInTree( parse( rawContent ) );
}

export function assignNavigationMenuToFirstBlock(
	part: TemplatePartRecord,
	navigationId: number,
	editedContent?: string | { raw?: string }
) {
	const rawContent = getTemplatePartRawContent( part, editedContent );

	if ( ! rawContent ) {
		return;
	}

	const blocks = parse( rawContent );

	if ( ! assignFirstNavigationBlockRef( blocks, navigationId ) ) {
		return;
	}

	return serialize( blocks );
}

export function removeNavigationMenuFromFirstBlock(
	part: TemplatePartRecord,
	navigationId: number,
	editedContent?: string | { raw?: string }
) {
	const rawContent = getTemplatePartRawContent( part, editedContent );

	if ( ! rawContent ) {
		return;
	}

	const blocks = parse( rawContent );

	if (
		! removeNavigationBlockRef( blocks, navigationId ) &&
		! markFirstNavigationBlockAsUnassigned( blocks )
	) {
		return;
	}

	return serialize( blocks );
}

export function getTemplatePartMenuRefs(
	templateParts: TemplatePartRecord[] | undefined,
	fallbackMenuId?: number,
	editedContentByPartId: Record< string, string | { raw?: string } > = {}
): TemplatePartMenuRef[] {
	if ( ! templateParts ) {
		return [];
	}

	return templateParts.reduce(
		( accumulator: TemplatePartMenuRef[], part ) => {
			const rawContent = getTemplatePartRawContent(
				part,
				editedContentByPartId[ String( part.id ) ]
			);

			if ( ! rawContent ) {
				return accumulator;
			}

			const menuIds = getReferencedMenuIds(
				parse( rawContent ),
				fallbackMenuId
			);

			if ( menuIds.length ) {
				accumulator.push( {
					part: {
						...part,
						content: rawContent,
						blocks: undefined,
					},
					menuIds,
				} );
			}

			return accumulator;
		},
		[]
	);
}

export function buildNavigationLocationsMap(
	partMenuRefs: TemplatePartMenuRef[]
) {
	const map: NavigationLocationsMap = {};
	const seenPartIdsByMenuId = new Map< number, Set< string > >();

	for ( const { part, menuIds } of partMenuRefs ) {
		for ( const menuId of menuIds ) {
			const partId = String( part.id );
			const seenPartIds =
				seenPartIdsByMenuId.get( menuId ) ?? new Set< string >();

			if ( seenPartIds.has( partId ) ) {
				continue;
			}

			seenPartIds.add( partId );
			seenPartIdsByMenuId.set( menuId, seenPartIds );

			map[ menuId ] = [
				...( map[ menuId ] ?? [] ),
				{
					id: partId,
					label: getLocationLabel( part ),
					part,
				},
			];
		}
	}

	for ( const menuId of Object.keys( map ) ) {
		map[ Number( menuId ) ].sort( ( firstLocation, secondLocation ) =>
			compareTemplatePartsByArea(
				firstLocation.part,
				secondLocation.part
			)
		);
	}

	return map;
}

export function getUniqueLocationLabels( locations: NavigationLocation[] ) {
	const labelCounts = locations.reduce< Record< string, number > >(
		( counts, location ) => ( {
			...counts,
			[ location.label ]: ( counts[ location.label ] ?? 0 ) + 1,
		} ),
		{}
	);
	const seenLabels: Record< string, number > = {};

	return locations.map( ( location ) => {
		seenLabels[ location.label ] =
			( seenLabels[ location.label ] ?? 0 ) + 1;

		return labelCounts[ location.label ] > 1
			? sprintf(
					/* translators: 1: Location label, 2: Duplicate location number. */
					__( '%1$s %2$d' ),
					location.label,
					seenLabels[ location.label ]
			  )
			: location.label;
	} );
}
