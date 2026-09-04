import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import {
	createContext,
	useCallback,
	useMemo,
	useState,
	type ReactNode,
} from '@wordpress/element';
import * as Combobox from '../combobox';
import type { ComboboxRootProps } from '../combobox/types';
import {
	NO_LIMIT,
	parseCatalog,
	project,
	resolveMatchFn,
	warnSearchableCollectionProps,
	type CollectionRenderer,
	type Item,
	type ItemGroup,
	type Projection,
	type SearchableCollectionName,
} from './model';

export type SearchableCollectionRootProps<
	Multiple extends boolean | undefined = false,
> = ComboboxRootProps< Item, Multiple > & {
	name: SearchableCollectionName;
	items?: Item[] | ItemGroup[];
	collection?: CollectionRenderer;
	children?: ReactNode;
};

export type SearchableCollectionContextValue = {
	readonly projection: Projection;
	readonly collection: CollectionRenderer | undefined;
};

const EMPTY_PROJECTION: Projection = {
	items: undefined,
	filteredItems: undefined,
	action: undefined,
};

export const SearchableCollectionContext =
	createContext< SearchableCollectionContextValue >( {
		projection: EMPTY_PROJECTION,
		collection: undefined,
	} );

export function SearchableCollectionRoot<
	Multiple extends boolean | undefined = false,
>( {
	name,
	items,
	collection,
	children,
	filter,
	limit,
	inputValue,
	defaultInputValue,
	onInputValueChange,
	filteredItems,
	locale,
	itemToStringLabel,
	...restProps
}: SearchableCollectionRootProps< Multiple > ) {
	const catalog = useMemo( () => parseCatalog( items ), [ items ] );
	warnSearchableCollectionProps( name, collection, catalog );
	const collator = BaseCombobox.useFilter( { locale } );
	const match = useMemo(
		() => resolveMatchFn( filter, collator.contains, itemToStringLabel ),
		[ filter, collator.contains, itemToStringLabel ]
	);
	const isInputControlled = inputValue !== undefined;
	const [ uncontrolledQuery, setUncontrolledQuery ] = useState( () =>
		String( defaultInputValue ?? '' )
	);
	const query = isInputControlled ? String( inputValue ) : uncontrolledQuery;
	const handleInputValueChange = useCallback(
		(
			value: string,
			eventDetails: Parameters<
				NonNullable<
					ComboboxRootProps< Item, Multiple >[ 'onInputValueChange' ]
				>
			>[ 1 ]
		) => {
			if ( ! isInputControlled ) {
				setUncontrolledQuery( value );
			}
			onInputValueChange?.( value, eventDetails );
		},
		[ isInputControlled, onInputValueChange ]
	);
	const projection = useMemo(
		() =>
			project( {
				catalog,
				query,
				match,
				limit,
				consumerFilteredItems: filteredItems as
					| Item[]
					| ItemGroup[]
					| undefined,
			} ),
		[ catalog, query, match, limit, filteredItems ]
	);
	const contextValue = useMemo(
		() => ( { projection, collection } ),
		[ projection, collection ]
	);

	if ( ! catalog.action ) {
		return (
			<Combobox.Root< Item, Multiple >
				items={ items }
				filter={ filter }
				limit={ limit }
				inputValue={ inputValue }
				defaultInputValue={ defaultInputValue }
				onInputValueChange={ onInputValueChange }
				filteredItems={ filteredItems }
				locale={ locale }
				itemToStringLabel={ itemToStringLabel }
				{ ...restProps }
			>
				<SearchableCollectionContext.Provider value={ contextValue }>
					{ children }
				</SearchableCollectionContext.Provider>
			</Combobox.Root>
		);
	}

	const omittedInput =
		inputValue === undefined && defaultInputValue === undefined;

	return (
		<Combobox.Root< Item, Multiple >
			items={ projection.items }
			filteredItems={ projection.filteredItems }
			limit={ NO_LIMIT }
			inputValue={ inputValue }
			defaultInputValue={ omittedInput ? '' : defaultInputValue }
			onInputValueChange={ handleInputValueChange }
			locale={ locale }
			itemToStringLabel={ itemToStringLabel }
			{ ...restProps }
		>
			<SearchableCollectionContext.Provider value={ contextValue }>
				{ children }
			</SearchableCollectionContext.Provider>
		</Combobox.Root>
	);
}
