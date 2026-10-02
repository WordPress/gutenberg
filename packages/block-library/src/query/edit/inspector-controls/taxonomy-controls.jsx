import { __experimentalVStack as VStack } from '@wordpress/components';
import {
	SearchableChipSelectControl,
	Spinner,
	Stack,
	VisuallyHidden,
} from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useEffect, useMemo, Fragment } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf, _n, _x, __ } from '@wordpress/i18n';
import { useTaxonomies } from '../../utils';

const EMPTY_ARRAY = [];
const EMPTY_MAP = new Map();
const BASE_QUERY = {
	order: 'asc',
	orderby: 'name',
	context: 'view',
};
const FLAT_QUERY = { ...BASE_QUERY, _fields: 'id,name' };
const TREE_QUERY = { ...BASE_QUERY, _fields: 'id,name,parent', per_page: -1 };

/**
 * How the limit for the browsable list of terms was chosen:
 *  - Matches the `per_page` range set by the REST API.
 *  - Mirrors the limit used by the post editor's flat term selector.
 */
const MAX_TERMS_TO_LIST = 100;
const MAX_SEARCH_RESULTS = 20;

/**
 * Terms are listed and selected as `{ value, label }` items, where `value` is
 * the stringified term id. Items come from different requests than the selected
 * value, so they are never referentially equal and have to be matched by id.
 *
 * @param {{value: string}} item     An item from the list.
 * @param {{value: string}} selected A currently selected item.
 * @return {boolean} Whether both refer to the same term.
 */
const isItemEqualToValue = ( item, selected ) => item.value === selected.value;

/**
 * Announces how many terms the list holds, once it holds them. The count comes
 * from the list itself rather than from what was requested, so it stays right
 * whatever narrows it.
 *
 * @return {React.JSX.Element|null} The announcement, or nothing while the list is empty.
 */
function ListedTermCount() {
	const count = SearchableChipSelectControl.useFilteredItems().length;

	if ( ! count ) {
		return null;
	}

	return (
		<VisuallyHidden>
			{ sprintf(
				/* translators: %d: number of terms found. */
				_n( '%d result found.', '%d results found.', count ),
				count
			) }
		</VisuallyHidden>
	);
}

const termToItem = ( term ) => ( {
	value: String( term.id ),
	label: decodeEntities( term.name ),
} );

/**
 * Turns the terms of a hierarchical taxonomy into items, keyed by term id. A
 * nested term is named after the terms it sits under, so that two terms
 * sharing a name can be told apart, in the list and in the chip alike.
 *
 * @param {Array<{id: number, name: string, parent: number}>} terms All the terms of the taxonomy.
 * @return {Map<number, {value: string, label: string}>} The items, keyed by term id.
 */
function getTreeItems( terms ) {
	const termById = new Map( terms.map( ( term ) => [ term.id, term ] ) );
	const items = new Map();
	for ( const term of terms ) {
		const ancestors = [];
		const visited = new Set( [ term.id ] );
		let parent = termById.get( term.parent );
		while ( parent && ! visited.has( parent.id ) ) {
			visited.add( parent.id );
			ancestors.unshift( decodeEntities( parent.name ) );
			parent = termById.get( parent.parent );
		}
		const name = decodeEntities( term.name );
		items.set( term.id, {
			value: String( term.id ),
			label: ancestors.length
				? sprintf(
						/* translators: 1: term name. 2: the terms it sits under, from the top level down. */
						_x( '%1$s (%2$s)', 'term' ),
						name,
						ancestors.reduce( ( path, ancestor ) =>
							sprintf(
								/* translators: 1: a term. 2: the term it holds. */
								_x( '%1$s › %2$s', 'term ancestors' ),
								path,
								ancestor
							)
						)
					)
				: name,
		} );
	}
	return items;
}

export function TaxonomyControls( { onChange, query } ) {
	const { postType, taxQuery } = query;

	const taxonomies = useTaxonomies( postType );
	if ( ! taxonomies?.length ) {
		return null;
	}

	return (
		<VStack spacing={ 4 }>
			{ taxonomies.map( ( taxonomy ) => {
				const includeTermIds =
					taxQuery?.include?.[ taxonomy.slug ] || [];
				const excludeTermIds =
					taxQuery?.exclude?.[ taxonomy.slug ] || [];
				const onChangeTaxQuery = (
					newTermIds,
					/** @type {'include'|'exclude'} */ key
				) => {
					const newPartialTaxQuery = {
						...taxQuery?.[ key ],
						[ taxonomy.slug ]: newTermIds,
					};
					// Remove empty arrays from the partial `taxQuery` (include|exclude).
					if ( ! newTermIds.length ) {
						delete newPartialTaxQuery[ taxonomy.slug ];
					}
					const newTaxQuery = {
						...taxQuery,
						[ key ]: !! Object.keys( newPartialTaxQuery ).length
							? newPartialTaxQuery
							: undefined,
					};
					onChange( {
						// Clean up `taxQuery` if all filters are removed.
						taxQuery: Object.values( newTaxQuery ).every(
							( value ) => ! value
						)
							? undefined
							: newTaxQuery,
					} );
				};
				return (
					<Fragment key={ taxonomy.slug }>
						<TaxonomyItem
							taxonomy={ taxonomy }
							termIds={ includeTermIds }
							oppositeTermIds={ excludeTermIds }
							onChange={ ( value ) =>
								onChangeTaxQuery( value, 'include' )
							}
							label={ taxonomy.name }
						/>
						<TaxonomyItem
							taxonomy={ taxonomy }
							termIds={ excludeTermIds }
							oppositeTermIds={ includeTermIds }
							onChange={ ( value ) =>
								onChangeTaxQuery( value, 'exclude' )
							}
							label={
								/* translators: %s: taxonomy name */
								sprintf( __( 'Exclude: %s' ), taxonomy.name )
							}
						/>
					</Fragment>
				);
			} ) }
		</VStack>
	);
}

/**
 * Renders a `SearchableChipSelectControl` for a given taxonomy.
 *
 * The list of terms is browsable: opening the control lists the existing terms
 * without requiring the user to remember and type their names. Typing narrows
 * the list down through a server side search.
 *
 * @param {Object}   props                 The props for the component.
 * @param {Object}   props.taxonomy        The taxonomy object.
 * @param {number[]} props.termIds         An array with the block's term ids for the given taxonomy.
 * @param {number[]} props.oppositeTermIds An array with the opposite control's term ids (to exclude from suggestions).
 * @param {Function} props.onChange        Callback `onChange` function.
 * @param {string}   props.label           Label of the control.
 * @return {React.JSX.Element} The rendered component.
 */
function TaxonomyItem( {
	taxonomy,
	termIds,
	oppositeTermIds,
	onChange,
	label,
} ) {
	// The list of terms is only requested once the user opens the control, so
	// that merely rendering the inspector does not fetch terms nobody browses.
	// Once opened, it stays subscribed to avoid refetching on every reopen.
	const [ hasOpened, setHasOpened ] = useState( false );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ search, setSearch ] = useState( '' );
	const [ value, setValue ] = useState( EMPTY_ARRAY );
	const debouncedSearch = useDebounce( setSearch, 250 );
	// A hierarchical taxonomy is fetched whole, like in the post editor's
	// hierarchical term selector, so that each term can be named after all the
	// terms it sits under. A flat one can be much larger, so it is searched.
	const isHierarchical = !! taxonomy.hierarchical;
	const needsTree = isHierarchical && ( hasOpened || !! termIds?.length );
	const { tree, treeHasResolved } = useSelect(
		( select ) => {
			if ( ! needsTree ) {
				return { tree: null, treeHasResolved: false };
			}
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );
			const selectorArgs = [ 'taxonomy', taxonomy.slug, TREE_QUERY ];
			return {
				tree: getEntityRecords( ...selectorArgs ),
				treeHasResolved: hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
			};
		},
		[ needsTree, taxonomy.slug ]
	);
	const treeItemById = useMemo(
		() => ( tree ? getTreeItems( tree ) : EMPTY_MAP ),
		[ tree ]
	);
	const { listedTerms, listHasResolved } = useSelect(
		( select ) => {
			if ( isHierarchical || ! hasOpened ) {
				return { listedTerms: EMPTY_ARRAY, listHasResolved: false };
			}
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );

			const selectorArgs = [
				'taxonomy',
				taxonomy.slug,
				{
					...FLAT_QUERY,
					// Exclude the opposite control's terms, to prevent users
					// from selecting the same term in both the include and the
					// exclude control. The terms selected in this control stay
					// listed, so that they can be deselected from the list and
					// so that selecting one does not change the query, which
					// would refetch the list mid-selection.
					exclude: oppositeTermIds,
					// Without a search, list the terms so they can be browsed.
					...( search
						? { search, per_page: MAX_SEARCH_RESULTS }
						: { per_page: MAX_TERMS_TO_LIST } ),
				},
			];
			return {
				listedTerms: getEntityRecords( ...selectorArgs ) || EMPTY_ARRAY,
				listHasResolved: hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
			};
		},
		[ isHierarchical, hasOpened, search, taxonomy.slug, oppositeTermIds ]
	);
	// `existingTerms` are the selected terms of a flat taxonomy, fetched with the same fields as the list.
	// They are used to extract the terms' names to populate the control properly
	// and to sanitize the provided `termIds`, by setting only the ones that exist.
	const existingTerms = useSelect(
		( select ) => {
			if ( isHierarchical || ! termIds?.length ) {
				return EMPTY_ARRAY;
			}
			const { getEntityRecords } = select( coreStore );
			return getEntityRecords( 'taxonomy', taxonomy.slug, {
				...FLAT_QUERY,
				include: termIds,
				per_page: termIds.length,
			} );
		},
		[ isHierarchical, taxonomy.slug, termIds ]
	);
	const selectedItemById = useMemo( () => {
		if ( isHierarchical ) {
			return treeItemById;
		}
		return new Map(
			( existingTerms || EMPTY_ARRAY ).map( ( term ) => [
				term.id,
				termToItem( term ),
			] )
		);
	}, [ isHierarchical, treeItemById, existingTerms ] );
	// Update the `value` state only after the selectors are resolved
	// to avoid emptying the input when we're changing terms.
	useEffect( () => {
		if ( ! termIds?.length ) {
			setValue( EMPTY_ARRAY );
		}
		if ( ! selectedItemById.size ) {
			return;
		}
		// Returns only the existing entity ids. This prevents the component
		// from crashing in the editor, when non existing ids are provided.
		setValue(
			termIds
				.map( ( id ) => selectedItemById.get( id ) )
				.filter( Boolean )
		);
	}, [ termIds, selectedItemById ] );
	const items = useMemo( () => {
		if ( ! isHierarchical ) {
			return listedTerms.map( termToItem );
		}
		const excludedIds = new Set( oppositeTermIds );
		return Array.from( treeItemById )
			.filter( ( [ id ] ) => ! excludedIds.has( id ) )
			.map( ( [ , item ] ) => item );
	}, [ isHierarchical, listedTerms, treeItemById, oppositeTermIds ] );
	const onInputValueChange = ( nextInputValue ) => {
		setInputValue( nextInputValue );
		if ( ! isHierarchical ) {
			debouncedSearch( nextInputValue );
		}
	};
	const onTermsChange = ( newValue ) => {
		if ( newValue.length !== value.length ) {
			const singularName = taxonomy.labels?.singular_name ?? __( 'Term' );
			speak(
				newValue.length > value.length
					? sprintf(
							/* translators: %s: taxonomy singular name, e.g. "Tag". */
							_x( '%s added', 'term' ),
							singularName
						)
					: sprintf(
							/* translators: %s: taxonomy singular name, e.g. "Tag". */
							_x( '%s removed', 'term' ),
							singularName
						),
				'assertive'
			);
		}
		// Reset the search so that the full list is offered for the next
		// selection, cancelling a search the debounce has not yet run.
		debouncedSearch.cancel();
		setInputValue( '' );
		setSearch( '' );
		// Show the selection right away. The effect above only catches up once
		// the request for the selected terms resolves, and until it does the
		// control would still be given the previous value, so a second selection
		// made in the meantime would be sent on its own and replace the first.
		setValue( newValue );
		onChange( newValue.map( ( item ) => Number( item.value ) ) );
	};
	const isDebouncing = ! isHierarchical && inputValue !== search;
	const isPending = isHierarchical
		? ! treeHasResolved
		: isDebouncing || ! listHasResolved;
	return (
		<div className="block-library-query-inspector__taxonomy-control">
			<SearchableChipSelectControl
				label={ label }
				items={ items }
				value={ value }
				onValueChange={ onTermsChange }
				inputValue={ inputValue }
				onInputValueChange={ onInputValueChange }
				onOpenChange={ ( isOpen ) => {
					if ( isOpen ) {
						setHasOpened( true );
					}
				} }
				// A flat taxonomy is searched server side, so opt out of the
				// built-in client side filtering rather than filtering twice,
				// except to narrow the previous results until the search runs.
				filter={ isHierarchical || isDebouncing ? undefined : null }
				autoHighlight
				isItemEqualToValue={ isItemEqualToValue }
				statusContent={
					isPending ? (
						<Stack direction="row" gap="sm" align="center">
							<Spinner />
							{ __( 'Loading…' ) }
						</Stack>
					) : (
						<ListedTermCount />
					)
				}
				// The status above reports the pending state, so the list should
				// not also claim there are no results before it has looked.
				emptyContent={ isPending ? null : undefined }
			/>
		</div>
	);
}
