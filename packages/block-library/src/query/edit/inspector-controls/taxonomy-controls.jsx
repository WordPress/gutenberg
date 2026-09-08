import { __experimentalVStack as VStack } from '@wordpress/components';
import { SearchableChipSelectControl } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useEffect, useMemo, Fragment } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf, __ } from '@wordpress/i18n';
import { useTaxonomies } from '../../utils';

const EMPTY_ARRAY = [];
const BASE_QUERY = {
	order: 'asc',
	orderby: 'name',
	_fields: 'id,name',
	context: 'view',
};

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

const termToItem = ( term ) => ( {
	value: String( term.id ),
	label: decodeEntities( term.name ),
} );

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
	const { listedTerms, listHasResolved } = useSelect(
		( select ) => {
			if ( ! hasOpened ) {
				return { listedTerms: EMPTY_ARRAY, listHasResolved: false };
			}
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );

			const selectorArgs = [
				'taxonomy',
				taxonomy.slug,
				{
					...BASE_QUERY,
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
		[ hasOpened, search, taxonomy.slug, oppositeTermIds ]
	);
	// `existingTerms` are the ones fetched from the API and their type is `{ id: number; name: string }`.
	// They are used to extract the terms' names to populate the control properly
	// and to sanitize the provided `termIds`, by setting only the ones that exist.
	const existingTerms = useSelect(
		( select ) => {
			if ( ! termIds?.length ) {
				return EMPTY_ARRAY;
			}
			const { getEntityRecords } = select( coreStore );
			return getEntityRecords( 'taxonomy', taxonomy.slug, {
				...BASE_QUERY,
				include: termIds,
				per_page: termIds.length,
			} );
		},
		[ taxonomy.slug, termIds ]
	);
	// Update the `value` state only after the selectors are resolved
	// to avoid emptying the input when we're changing terms.
	useEffect( () => {
		if ( ! termIds?.length ) {
			setValue( EMPTY_ARRAY );
		}
		if ( ! existingTerms?.length ) {
			return;
		}
		// Returns only the existing entity ids. This prevents the component
		// from crashing in the editor, when non existing ids are provided.
		const sanitizedValue = termIds.reduce( ( accumulator, id ) => {
			const entity = existingTerms.find( ( term ) => term.id === id );
			if ( entity ) {
				accumulator.push( termToItem( entity ) );
			}
			return accumulator;
		}, [] );
		setValue( sanitizedValue );
	}, [ termIds, existingTerms ] );
	const items = useMemo(
		() => listedTerms.map( termToItem ),
		[ listedTerms ]
	);
	const onInputValueChange = ( nextInputValue ) => {
		setInputValue( nextInputValue );
		debouncedSearch( nextInputValue );
	};
	const onTermsChange = ( newValue ) => {
		// Reset the search so that the full list is offered for the next
		// selection, cancelling a search the debounce has not yet run.
		debouncedSearch.cancel();
		setInputValue( '' );
		setSearch( '' );
		onChange( newValue.map( ( item ) => Number( item.value ) ) );
	};
	// A request is pending either while the debounce has not caught up with what
	// has been typed, or while the request it triggered is still resolving.
	// Without this the control would claim there are no results before it has
	// looked for any.
	const isPending = inputValue !== search || ! listHasResolved;
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
				// Terms are searched server side, so opt out of the built-in
				// client side filtering rather than filtering twice.
				filter={ null }
				isItemEqualToValue={ isItemEqualToValue }
				emptyContent={ isPending ? __( 'Loading…' ) : undefined }
			/>
		</div>
	);
}
