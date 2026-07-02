/**
 * WordPress dependencies
 */
import {
	FormTokenField,
	__experimentalVStack as VStack,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useEffect, Fragment, useMemo } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useTaxonomies } from '../../utils';

const EMPTY_ARRAY = [];
const BASE_QUERY = {
	order: 'asc',
	_fields: 'id,name',
	context: 'view',
};

// Helper function to get the term id based on user input in terms `FormTokenField`.
const getTermIdByTermValue = ( terms, termValue ) => {
	// First we check for exact match by `term.id` or case sensitive `term.name` match.
	const termId =
		termValue?.id || terms?.find( ( term ) => term.name === termValue )?.id;
	if ( termId ) {
		return termId;
	}

	/**
	 * Here we make an extra check for entered terms in a non case sensitive way,
	 * to match user expectations, due to `FormTokenField` behaviour that shows
	 * suggestions which are case insensitive.
	 *
	 * Although WP tries to discourage users to add terms with the same name (case insensitive),
	 * it's still possible if you manually change the name, as long as the terms have different slugs.
	 * In this edge case we always apply the first match from the terms list.
	 */
	const termValueLower = termValue.toLocaleLowerCase();
	return terms?.find(
		( term ) => term.name.toLocaleLowerCase() === termValueLower
	)?.id;
};

export function TaxonomyControls( { onChange, query, context } ) {
	const { postType, taxQuery } = query;
	const { postId } = context;
	const taxonomies = useTaxonomies( postType );

	const currentPost = useSelect(
		( select ) => {
			if ( ! postId ) {
				return null;
			}
			select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
		},
		[ postType, postId ]
	);

	const postTypeObject = useSelect(
		( select ) => select( coreStore ).getPostType( postType ),
		[ postType ]
	);

	const CurrentPostTerms = useMemo(
		() =>
			( taxonomies || [] ).reduce( ( termsByTaxonomy, taxonomy ) => {
				const restBase = taxonomy.rest_base || taxonomy.slug;
				termsByTaxonomy[ taxonomy.slug ] =
					currentPost?.[ restBase ] || [];
				return termsByTaxonomy;
			}, {} ),
		[ currentPost, taxonomies ]
	);

	useEffect( () => {
		if (
			! postId ||
			! taxQuery?.__experimentalSameTerm ||
			! taxonomies?.length
		) {
			return;
		}

		const nextInclude = {
			...taxQuery?.include,
		};

		let hasChanged = false;

		const nextQueryUpdates = {};

		for ( const taxonomy of taxonomies ) {
			const termIds = CurrentPostTerms?.[ taxonomy.slug ] || [];

			const existingIds = taxQuery?.include?.[ taxonomy.slug ] || [];

			const isSame =
				existingIds.length === termIds.length &&
				existingIds.every( ( id ) => termIds.includes( id ) );

			if ( isSame ) {
				continue;
			}

			if ( termIds?.length ) {
				nextInclude[ taxonomy.slug ] = termIds;
			} else {
				delete nextInclude[ taxonomy.slug ];
			}
			hasChanged = true;

			const restBase = taxonomy.rest_base || taxonomy.slug;

			if ( termIds.length ) {
				nextQueryUpdates[ restBase ] = termIds;
			} else {
				nextQueryUpdates[ restBase ] = [];
			}
		}

		if ( ! hasChanged ) {
			return;
		}

		const nextExclude = query.exclude?.includes( postId )
			? query.exclude
			: [ ...( query.exclude || [] ), postId ];

		onChange( {
			...nextQueryUpdates,
			exclude: nextExclude,
			taxQuery: {
				...taxQuery,
				include: nextInclude,
				__experimentalSameTerm: true,
			},
		} );
	}, [ CurrentPostTerms, onChange, postId, taxQuery, taxonomies ] );

	if ( ! taxonomies?.length ) {
		return null;
	}
	const label = sprintf(
		/* translators: %s: Post type plural name */
		__( 'Show related %s' ),
		postTypeObject.labels.name.toLowerCase()
	);
	return (
		<VStack spacing={ 4 }>
			<ToggleControl
				label={ label }
				checked={ !! taxQuery?.__experimentalSameTerm }
				onChange={ ( value ) => {
					onChange(
						value
							? {
									taxQuery: {
										...taxQuery,
										__experimentalSameTerm: true,
									},
							  }
							: {
									taxQuery: undefined,
									exclude: ( query.exclude || [] ).filter(
										( id ) => id !== postId
									),
									...Object.fromEntries(
										( taxonomies || [] ).map(
											( taxonomy ) => [
												taxonomy.rest_base ||
													taxonomy.slug,
												[],
											]
										)
									),
							  }
					);
				} }
			/>
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
							isSameTerm={ !! taxQuery?.__experimentalSameTerm }
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
							isSameTerm={ !! taxQuery?.__experimentalSameTerm }
						/>
					</Fragment>
				);
			} ) }
		</VStack>
	);
}

/**
 * Renders a `FormTokenField` for a given taxonomy.
 *
 * @param {Object}   props                 The props for the component.
 * @param {Object}   props.taxonomy        The taxonomy object.
 * @param {number[]} props.termIds         An array with the block's term ids for the given taxonomy.
 * @param {number[]} props.oppositeTermIds An array with the opposite control's term ids (to exclude from suggestions).
 * @param {Function} props.onChange        Callback `onChange` function.
 * @param {string}   props.label           Label of the control.
 * @param {boolean}  props.isSameTerm      Whether to show related posts.
 * @return {React.JSX.Element} The rendered component.
 */
function TaxonomyItem( {
	taxonomy,
	termIds,
	oppositeTermIds,
	onChange,
	label,
	isSameTerm,
} ) {
	const [ search, setSearch ] = useState( '' );
	const [ value, setValue ] = useState( EMPTY_ARRAY );
	const [ suggestions, setSuggestions ] = useState( EMPTY_ARRAY );
	const debouncedSearch = useDebounce( setSearch, 250 );
	const { searchResults, searchHasResolved } = useSelect(
		( select ) => {
			if ( ! search ) {
				return { searchResults: EMPTY_ARRAY, searchHasResolved: true };
			}
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );

			// Combine current terms and opposite terms for exclusion, to prevent
			// users from selecting the same term in both include and exclude controls.
			const combinedExclude = [ ...termIds, ...oppositeTermIds ];

			const selectorArgs = [
				'taxonomy',
				taxonomy.slug,
				{
					...BASE_QUERY,
					search,
					orderby: 'name',
					exclude: combinedExclude,
					per_page: 20,
				},
			];
			return {
				searchResults: getEntityRecords( ...selectorArgs ),
				searchHasResolved: hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
			};
		},
		[ search, taxonomy.slug, termIds, oppositeTermIds ]
	);
	// `existingTerms` are the ones fetched from the API and their type is `{ id: number; name: string }`.
	// They are used to extract the terms' names to populate the `FormTokenField` properly
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
				accumulator.push( {
					id,
					value: entity.name,
				} );
			}
			return accumulator;
		}, [] );
		setValue( sanitizedValue );
	}, [ termIds, existingTerms ] );
	// Update suggestions only when the query has resolved.
	useEffect( () => {
		if ( ! searchHasResolved ) {
			return;
		}
		setSuggestions( searchResults.map( ( result ) => result.name ) );
	}, [ searchResults, searchHasResolved ] );
	const onTermsChange = ( newTermValues ) => {
		const newTermIds = new Set();
		for ( const termValue of newTermValues ) {
			const termId = getTermIdByTermValue( searchResults, termValue );
			if ( termId ) {
				newTermIds.add( termId );
			}
		}
		setSuggestions( EMPTY_ARRAY );
		onChange( Array.from( newTermIds ) );
	};
	return (
		<div className="block-library-query-inspector__taxonomy-control">
			<FormTokenField
				label={ label }
				value={ value }
				onInputChange={ debouncedSearch }
				suggestions={ suggestions }
				displayTransform={ decodeEntities }
				onChange={ onTermsChange }
				help=""
				__next40pxDefaultSize
				disabled={ isSameTerm }
			/>
		</div>
	);
}
