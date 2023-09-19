/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

const unescapeString = ( arg ) => {
	return decodeEntities( arg );
};

const unescapeTerm = ( term ) => {
	return {
		...term,
		name: unescapeString( term.name ),
	};
};

const EMPTY_ARRAY = [];
const MAX_TERMS_SUGGESTIONS = 20;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	_fields: 'id,name',
	context: 'view',
};
const slug = 'wp_pattern_category';

export default function CategorySelector( { onCategorySelection } ) {
	const [ values, setValues ] = useState( [] );
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );
	const { invalidateResolution } = useDispatch( coreStore );

	const { searchResults } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );

			return {
				searchResults: !! search
					? getEntityRecords( 'taxonomy', slug, {
							...DEFAULT_QUERY,
							search,
					  } )
					: EMPTY_ARRAY,
			};
		},
		[ search ]
	);

	const suggestions = useMemo( () => {
		return ( searchResults ?? [] ).map( ( term ) =>
			unescapeString( term.name )
		);
	}, [ searchResults ] );

	const { saveEntityRecord } = useDispatch( coreStore );

	async function findOrCreateTerm( term ) {
		try {
			const newTerm = await saveEntityRecord( 'taxonomy', slug, term, {
				throwOnError: true,
			} );
			invalidateResolution( 'getUserPatternCategories' );
			return unescapeTerm( newTerm );
		} catch ( error ) {
			if ( error.code !== 'term_exists' ) {
				throw error;
			}

			return {
				id: error.data.term_id,
				name: term.name,
			};
		}
	}

	function onChange( termNames ) {
		const uniqueTerms = termNames.reduce( ( terms, newTerm ) => {
			if (
				! terms.some(
					( term ) => term.toLowerCase() === newTerm.toLowerCase()
				)
			) {
				terms.push( newTerm );
			}
			return terms;
		}, [] );

		setValues( uniqueTerms );

		Promise.all(
			uniqueTerms.map( ( termName ) =>
				findOrCreateTerm( { name: termName } )
			)
		).then( ( newTerms ) => {
			onCategorySelection( newTerms );
		} );
	}

	return (
		<>
			<FormTokenField
				className="patterns-menu-items__convert-modal-categories"
				value={ values }
				suggestions={ suggestions }
				onChange={ onChange }
				onInputChange={ debouncedSearch }
				maxSuggestions={ MAX_TERMS_SUGGESTIONS }
				label={ __( 'Categories' ) }
				tokenizeOnBlur={ true }
			/>
		</>
	);
}
