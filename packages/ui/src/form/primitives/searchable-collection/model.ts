import warning from '@wordpress/warning';
import type {
	ComboboxCollectionProps,
	ComboboxRootProps,
} from '../combobox/types';

export type Item = {
	label: string;
	value: string;
	disabled?: boolean;
	creatable?: boolean;
};

export type CreatableItem = Item & { creatable: true };

export type RegularItem = Omit< Item, 'creatable' > & { creatable?: false };

export type ItemGroup = {
	label: string;
	items: Item[];
};

export type RegularGroup = {
	label: string;
	items: RegularItem[];
};

export type Catalog =
	| {
			readonly shape: 'empty';
			readonly results: readonly [];
			readonly action: undefined;
			readonly creatableCount: number;
	  }
	| {
			readonly shape: 'flat';
			readonly results: readonly RegularItem[];
			readonly action: CreatableItem | undefined;
			readonly creatableCount: number;
	  }
	| {
			readonly shape: 'grouped';
			readonly results: readonly RegularGroup[];
			readonly action: CreatableItem | undefined;
			readonly actionGroupLabel: string;
			readonly creatableCount: number;
	  };

export type MatchFn = ( item: RegularItem, query: string ) => boolean;

export type FilterProp = ComboboxRootProps< Item, boolean >[ 'filter' ];

export const NO_LIMIT = -1;

export type Projection = {
	readonly items: Item[] | ItemGroup[] | undefined;
	readonly filteredItems: Item[] | ItemGroup[] | undefined;
	readonly action: CreatableItem | undefined;
};

export type CollectionRenderer = ComboboxCollectionProps[ 'children' ];

export type SearchableCollectionName =
	| 'SearchableSelect'
	| 'SearchableChipSelect';

export function isItemGroup( entry: Item | ItemGroup ): entry is ItemGroup {
	return 'items' in entry && Array.isArray( entry.items );
}

export function isItem( entry: Item | ItemGroup ): entry is Item {
	return ! isItemGroup( entry );
}

export function isCreatableItem( item: Item ): item is CreatableItem {
	return item.creatable === true;
}

export function isRegularItem( item: Item ): item is RegularItem {
	return item.creatable !== true;
}

export function parseCatalog(
	items: Item[] | ItemGroup[] | undefined
): Catalog {
	if ( ! items?.length ) {
		return {
			shape: 'empty',
			results: [],
			action: undefined,
			creatableCount: 0,
		};
	}

	if ( items.some( isItemGroup ) ) {
		return parseGroupedCatalog( items );
	}

	return parseFlatCatalog( items as Item[] );
}

function parseFlatCatalog( items: Item[] ): Catalog {
	const results: RegularItem[] = [];
	let action: CreatableItem | undefined;
	let creatableCount = 0;

	for ( const entry of items ) {
		if ( isCreatableItem( entry ) ) {
			creatableCount += 1;
			if ( ! action ) {
				action = entry;
			}
			continue;
		}

		if ( isRegularItem( entry ) ) {
			results.push( entry );
		}
	}

	return {
		shape: 'flat',
		results,
		action,
		creatableCount,
	};
}

function parseGroupedCatalog( items: Item[] | ItemGroup[] ): Catalog {
	const results: RegularGroup[] = [];
	let action: CreatableItem | undefined;
	let creatableCount = 0;
	let actionGroupLabel = '';

	for ( const entry of items ) {
		if ( ! isItemGroup( entry ) ) {
			continue;
		}

		const regulars: RegularItem[] = [];

		for ( const item of entry.items ) {
			if ( isCreatableItem( item ) ) {
				creatableCount += 1;
				if ( ! action ) {
					action = item;
				}
				continue;
			}

			if ( isRegularItem( item ) ) {
				regulars.push( item );
			}
		}

		const isCreatableOnly =
			entry.items.length > 0 && entry.items.every( isCreatableItem );

		if ( isCreatableOnly ) {
			if ( actionGroupLabel === '' ) {
				actionGroupLabel = entry.label;
			}
			continue;
		}

		if ( regulars.length > 0 ) {
			results.push( {
				...entry,
				items: regulars,
			} );
		}
	}

	return {
		shape: 'grouped',
		results,
		action,
		actionGroupLabel,
		creatableCount,
	};
}

export function resolveMatchFn(
	filter: FilterProp,
	collatorContains: (
		item: Item,
		query: string,
		itemToStringLabel?: ( item: Item ) => string
	) => boolean,
	itemToStringLabel?: ( item: Item ) => string
): MatchFn {
	if ( filter === null ) {
		return () => true;
	}

	if ( typeof filter === 'function' ) {
		return ( item, query ) => filter( item, query, itemToStringLabel );
	}

	return ( item, query ) =>
		collatorContains( item, query, itemToStringLabel );
}

export function project( args: {
	catalog: Catalog;
	query: string;
	match: MatchFn;
	limit: number | undefined;
	consumerFilteredItems?: Item[] | ItemGroup[];
} ): Projection {
	const { catalog, query, match, limit, consumerFilteredItems } = args;

	if ( ! catalog.action ) {
		return {
			items:
				catalog.shape === 'empty'
					? undefined
					: ( [ ...catalog.results ] as Item[] | ItemGroup[] ),
			filteredItems: undefined,
			action: undefined,
		};
	}

	const body =
		consumerFilteredItems !== undefined
			? stripCreatable( consumerFilteredItems )
			: walkResults( catalog, query, match, limit );

	return {
		items: pinAction(
			catalog,
			catalog.shape === 'empty'
				? []
				: ( [ ...catalog.results ] as Item[] | ItemGroup[] )
		),
		filteredItems: pinAction( catalog, body ),
		action: catalog.action,
	};
}

function walkResults(
	catalog: Catalog,
	query: string,
	match: MatchFn,
	limit: number | undefined
): Item[] | ItemGroup[] {
	if ( catalog.shape === 'empty' ) {
		return [];
	}

	const cap = limit === undefined || limit <= NO_LIMIT ? Infinity : limit;
	const isEmptyQuery = query.trim() === '';

	if ( catalog.shape === 'flat' ) {
		if ( isEmptyQuery ) {
			return cap === Infinity
				? [ ...catalog.results ]
				: catalog.results.slice( 0, cap );
		}

		const matched: RegularItem[] = [];
		for ( const item of catalog.results ) {
			if ( matched.length >= cap ) {
				break;
			}
			if ( match( item, query ) ) {
				matched.push( item );
			}
		}
		return matched;
	}

	const groups: RegularGroup[] = [];
	let count = 0;

	for ( const group of catalog.results ) {
		if ( count >= cap ) {
			break;
		}

		const remaining = cap - count;
		let taken: RegularItem[];

		if ( isEmptyQuery ) {
			taken = group.items.slice( 0, remaining );
		} else {
			taken = [];
			for ( const item of group.items ) {
				if ( taken.length >= remaining ) {
					break;
				}
				if ( match( item, query ) ) {
					taken.push( item );
				}
			}
		}

		if ( taken.length > 0 ) {
			groups.push( {
				...group,
				items: taken,
			} );
			count += taken.length;
		}
	}

	return groups;
}

function stripCreatable( items: Item[] | ItemGroup[] ): Item[] | ItemGroup[] {
	if ( items.some( isItemGroup ) ) {
		const groups: ItemGroup[] = [];

		for ( const entry of items ) {
			if ( ! isItemGroup( entry ) ) {
				continue;
			}

			const regulars = entry.items.filter( isRegularItem );
			if ( regulars.length > 0 ) {
				groups.push( {
					...entry,
					items: regulars,
				} );
			}
		}

		return groups;
	}

	return ( items as Item[] ).filter( isRegularItem );
}

export function pinAction(
	catalog: Catalog,
	results: Item[] | ItemGroup[]
): Item[] | ItemGroup[] {
	if ( ! catalog.action ) {
		return results;
	}

	if ( catalog.shape === 'grouped' ) {
		return [
			...( results as ItemGroup[] ),
			{
				label: catalog.actionGroupLabel,
				items: [ catalog.action ],
			},
		];
	}

	return [ ...( results as Item[] ), catalog.action ];
}

export function isActionEntry(
	entry: Item | ItemGroup,
	action: CreatableItem | undefined
): boolean {
	if ( ! action ) {
		return false;
	}

	if ( isItem( entry ) ) {
		return entry.value === action.value;
	}

	return (
		entry.items.length > 0 &&
		entry.items.every( ( item ) => item.value === action.value )
	);
}

export function warnSearchableCollectionProps(
	name: SearchableCollectionName,
	children: CollectionRenderer | undefined,
	catalog: Catalog
): void {
	if ( catalog.creatableCount > 1 ) {
		warning(
			`${ name }: expected at most one item with \`creatable: true\` in \`items\`.`
		);
	}

	if ( catalog.shape === 'grouped' && ! children ) {
		warning(
			`${ name }: grouped \`items\` require a \`children\` renderer. See the \`Grouped\` story for an example.`
		);
	}
}
