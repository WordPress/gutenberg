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

const MAX_TERMS_TO_LIST = 100;
const MAX_SEARCH_RESULTS = 20;
// The largest `per_page` the REST API accepts.
const MAX_PER_PAGE = 100;

/**
 * Matches items by term id.
 *
 * @param {{value: string}} item     An item from the list.
 * @param {{value: string}} selected A currently selected item.
 * @return {boolean} Whether both refer to the same term.
 */
const isItemEqualToValue = ( item, selected ) => item.value === selected.value;

/**
 * Announces how many terms the list holds.
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

/**
 * Explains that the server returned only part of the matching terms, and how to find more.
 *
 * @param {Object}  props
 * @param {boolean} props.isSearch Whether the terms are search results.
 * @param {number}  props.shown    The number of terms shown.
 * @param {number}  props.total    The number of matching terms.
 */
function LimitedTermCount( { isSearch, shown, total } ) {
	if ( ! isSearch ) {
		return sprintf(
			/* translators: %d: number of terms shown. */
			__( 'Showing the first %d. Search to find more.' ),
			shown
		);
	}
	return sprintf(
		/* translators: 1: number of terms shown. 2: number of matching terms. */
		_n(
			'Showing %1$d of %2$d result. Refine your search to see more.',
			'Showing %1$d of %2$d results. Refine your search to see more.',
			total
		),
		shown,
		total
	);
}

const termToItem = ( term ) => ( {
	value: String( term.id ),
	label: decodeEntities( term.name ),
} );

/**
 * Turns the terms of a hierarchical taxonomy into items, keyed by term id.
 * A nested term carries the terms it sits under as its description.
 *
 * @param {Array<{id: number, name: string, parent: number}>} terms All the terms of the taxonomy.
 * @return {Map<number, {value: string, label: string, description?: string}>} The items, keyed by term id.
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
		items.set( term.id, {
			value: String( term.id ),
			label: decodeEntities( term.name ),
			description: ancestors.length
				? ancestors.reduce( ( path, ancestor ) =>
						sprintf(
							/* translators: 1: a term. 2: the term it holds. */
							_x( '%1$s › %2$s', 'term ancestors' ),
							path,
							ancestor
						)
					)
				: undefined,
		} );
	}
	return items;
}

/**
 * Renders the selected terms of a hierarchical taxonomy as chips, showing the
 * terms a nested term sits under in a quieter style than its name.
 *
 * @param {Array<{value: string, label: string, description?: string}>} selected The selected items.
 * @return {React.JSX.Element[]} The chips.
 */
function renderTreeChips( selected ) {
	return selected.map( ( item ) => (
		<SearchableChipSelectControl.ChipWithRemove
			key={ item.value }
			aria-label={
				item.description
					? sprintf(
							/* translators: 1: term name. 2: the terms it sits under, from the top level down. */
							_x( '%1$s (%2$s)', 'term' ),
							item.label,
							item.description
						)
					: undefined
			}
		>
			{ item.label }
			{ item.description && (
				<span className="block-library-query-inspector__taxonomy-control-path">
					{ item.description }
				</span>
			) }
		</SearchableChipSelectControl.ChipWithRemove>
	) );
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
					taxQuery?.include?.[ taxonomy.slug ] || EMPTY_ARRAY;
				const excludeTermIds =
					taxQuery?.exclude?.[ taxonomy.slug ] || EMPTY_ARRAY;
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
 * the list down, in the browser for a hierarchical taxonomy and through a
 * server side search for a flat one.
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
	const [ hasOpened, setHasOpened ] = useState( false );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ search, setSearch ] = useState( '' );
	const [ value, setValue ] = useState( EMPTY_ARRAY );
	const debouncedSearch = useDebounce( setSearch, 250 );
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
			const records = getEntityRecords( ...selectorArgs );
			const hasResolved = hasFinishedResolution(
				'getEntityRecords',
				selectorArgs
			);
			return {
				tree: hasResolved ? records : null,
				treeHasResolved: hasResolved,
			};
		},
		[ needsTree, taxonomy.slug ]
	);
	const treeItemById = useMemo(
		() => ( tree ? getTreeItems( tree ) : EMPTY_MAP ),
		[ tree ]
	);
	const oppositeTermsCount = oppositeTermIds.length;
	const { listedTerms, listTotal, listHasResolved } = useSelect(
		( select ) => {
			if ( isHierarchical || ! hasOpened ) {
				return {
					listedTerms: EMPTY_ARRAY,
					listTotal: null,
					listHasResolved: false,
				};
			}
			const {
				getEntityRecords,
				getEntityRecordsTotalItems,
				hasFinishedResolution,
			} = select( coreStore );

			// The opposite control's terms are filtered out of the list
			// below, so fetch as many more terms to make up for them.
			const perPage = Math.min(
				( search ? MAX_SEARCH_RESULTS : MAX_TERMS_TO_LIST ) +
					oppositeTermsCount,
				MAX_PER_PAGE
			);
			const selectorArgs = [
				'taxonomy',
				taxonomy.slug,
				{
					...FLAT_QUERY,
					...( search && { search } ),
					per_page: perPage,
				},
			];
			return {
				listedTerms: getEntityRecords( ...selectorArgs ) || EMPTY_ARRAY,
				listTotal: getEntityRecordsTotalItems( ...selectorArgs ),
				listHasResolved: hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
			};
		},
		[ isHierarchical, hasOpened, search, taxonomy.slug, oppositeTermsCount ]
	);
	const [ lastListedTerms, setLastListedTerms ] = useState( EMPTY_ARRAY );
	useEffect( () => {
		if ( listHasResolved ) {
			setLastListedTerms( listedTerms );
		}
	}, [ listHasResolved, listedTerms ] );
	const shownTerms = listHasResolved ? listedTerms : lastListedTerms;
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
		const excludedIds = new Set( oppositeTermIds.map( String ) );
		const listed = isHierarchical
			? Array.from( treeItemById.values() )
			: shownTerms.map( termToItem );
		return listed.filter( ( item ) => ! excludedIds.has( item.value ) );
	}, [ isHierarchical, treeItemById, shownTerms, oppositeTermIds ] );
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
		debouncedSearch.cancel();
		setInputValue( '' );
		setSearch( '' );
		// Show the selection right away, before the selected terms resolve.
		setValue( newValue );
		onChange( newValue.map( ( item ) => Number( item.value ) ) );
	};
	const isDebouncing = ! isHierarchical && inputValue !== search;
	const isPending = isHierarchical
		? ! treeHasResolved
		: isDebouncing || ! listHasResolved;
	// The server limits how many terms of a flat taxonomy are listed. When
	// there are more, say so. The total includes the opposite control's terms,
	// which are filtered out of the list, so leave those out of it too.
	const isLimited = ! isHierarchical && listTotal > shownTerms.length;
	const matchingTotal = listTotal - ( shownTerms.length - items.length );
	let statusContent = <ListedTermCount />;
	if ( isPending ) {
		statusContent = (
			<Stack direction="row" gap="sm" align="center">
				<Spinner />
				{ __( 'Loading…' ) }
			</Stack>
		);
	} else if ( isLimited ) {
		statusContent = (
			<LimitedTermCount
				isSearch={ !! search }
				shown={ items.length }
				total={ matchingTotal }
			/>
		);
	}
	return (
		<div
			className="block-library-query-inspector__taxonomy-control"
			onKeyDownCapture={ ( event ) => {
				if (
					event.key === 'Enter' &&
					isPending &&
					event.target.getAttribute( 'role' ) === 'combobox' &&
					! event.target.getAttribute( 'aria-activedescendant' )
				) {
					event.preventDefault();
					event.stopPropagation();
				}
			} }
		>
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
				filter={ isHierarchical || isPending ? undefined : null }
				autoHighlight={ inputValue ? 'always' : true }
				isItemEqualToValue={ isItemEqualToValue }
				chipsContent={ isHierarchical ? renderTreeChips : undefined }
				statusContent={ statusContent }
				emptyContent={ isPending ? null : undefined }
			/>
		</div>
	);
}
