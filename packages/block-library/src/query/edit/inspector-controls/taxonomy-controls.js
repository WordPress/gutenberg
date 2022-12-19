/**
 * WordPress dependencies
 */
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';

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
		termValue?.id || terms.find( ( term ) => term.name === termValue )?.id;
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
	return terms.find(
		( term ) => term.name.toLocaleLowerCase() === termValueLower
	)?.id;
};

export function TaxonomyControls( { onChange, query } ) {
	const { postType, taxQuery } = query;

	const taxonomies = useTaxonomies( postType );
	if ( ! taxonomies || taxonomies.length === 0 ) {
		return null;
	}

	return (
		<>
			{ taxonomies.map( ( taxonomy ) => {
				const value = taxQuery?.[ taxonomy.slug ] || [];
				const handleChange = ( newTermIds ) =>
					onChange( {
						taxQuery: {
							...taxQuery,
							[ taxonomy.slug ]: newTermIds,
						},
					} );

				return (
					<TaxonomyItem
						key={ taxonomy.slug }
						taxonomy={ taxonomy }
						terms={ value }
						onChange={ handleChange }
					/>
				);
			} ) }
		</>
	);
}

function TaxonomyItem( { taxonomy, terms, onChange } ) {
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
			const selectorArgs = [
				'taxonomy',
				taxonomy.slug,
				{
					...BASE_QUERY,
					search,
					orderby: 'name',
					exclude: terms,
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
		[ search, terms ]
	);
	const currentTerms = useSelect(
		( select ) => {
			if ( ! terms?.length ) return EMPTY_ARRAY;
			const { getEntityRecords } = select( coreStore );
			return getEntityRecords( 'taxonomy', taxonomy.slug, {
				...BASE_QUERY,
				include: terms,
				per_page: terms.length,
			} );
		},
		[ terms ]
	);
	// Update the `value` state only after the selectors are resolved
	// to avoid emptying the input when we're changing terms.
	useEffect( () => {
		if ( ! terms?.length ) {
			setValue( EMPTY_ARRAY );
		}
		if ( ! currentTerms?.length ) return;
		// Returns only the existing entity ids. This prevents the component
		// from crashing in the editor, when non existing ids are provided.
		const sanitizedValue = terms.reduce( ( accumulator, id ) => {
			const entity = currentTerms.find( ( term ) => term.id === id );
			if ( entity ) {
				accumulator.push( {
					id,
					value: entity.name,
				} );
			}
			return accumulator;
		}, [] );
		setValue( sanitizedValue );
	}, [ terms, currentTerms ] );
	// Update suggestions only when the query has resolved.
	useEffect( () => {
		if ( ! searchHasResolved ) return;
		setSuggestions( searchResults.map( ( result ) => result.name ) );
	}, [ searchResults, searchHasResolved ] );
	const onTermsChange = ( newTermValues ) => {
		const termIds = new Set();
		for ( const termValue of newTermValues ) {
			const termId = getTermIdByTermValue( searchResults, termValue );
			if ( termId ) {
				termIds.add( termId );
			}
		}
		setSuggestions( EMPTY_ARRAY );
		onChange( Array.from( termIds ) );
	};
	return (
		<FormTokenField
			label={ taxonomy.name }
			value={ value }
			onInputChange={ debouncedSearch }
			suggestions={ suggestions }
			onChange={ onTermsChange }
			__experimentalShowHowTo={ false }
		/>
	);
}
