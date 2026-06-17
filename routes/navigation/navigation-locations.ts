/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
// @ts-expect-error - No type declarations available for @wordpress/blocks.
import { parse } from '@wordpress/blocks';

type ParsedBlock = {
	name?: string;
	attributes?: {
		ref?: number | string;
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

export function getTemplatePartTitle( part: TemplatePartRecord ) {
	const title =
		typeof part.title === 'string'
			? part.title
			: part.title?.rendered || part.title?.raw;

	return title ? decodeEntities( title ) : '';
}

export function getLocationLabel( part: TemplatePartRecord ) {
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
		return __( 'Not shown' );
	}

	const uniqueLabels = Array.from(
		new Set( locations.map( ( location ) => location.label ) )
	);

	if ( locations.length === 1 ) {
		return uniqueLabels[ 0 ];
	}

	if ( locations.length === 2 && uniqueLabels.length === 2 ) {
		return sprintf(
			/* translators: 1: First location name, 2: second location name. */
			__( '%1$s and %2$s' ),
			uniqueLabels[ 0 ],
			uniqueLabels[ 1 ]
		);
	}

	return sprintf(
		/* translators: %d: Number of locations where this navigation menu is shown. */
		__( '%d locations' ),
		locations.length
	);
}

function getRawContent(
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
			const rawContent = getRawContent(
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
				accumulator.push( { part, menuIds } );
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
