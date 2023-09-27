/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

const unescapeString = ( arg ) => {
	return decodeEntities( arg );
};

const EMPTY_ARRAY = [];
const MAX_TERMS_SUGGESTIONS = 20;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	_fields: 'id,name',
	context: 'view',
};
export const CATEGORY_SLUG = 'wp_pattern_category';

export default function CategorySelector( { values, onChange } ) {
	const [ search, setSearch ] = useState( '' );
	const debouncedSearch = useDebounce( setSearch, 500 );

	const { searchResults } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );

			return {
				searchResults: !! search
					? getEntityRecords( 'taxonomy', CATEGORY_SLUG, {
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

	function handleChange( termNames ) {
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

		onChange( uniqueTerms );
	}

	return (
		<>
			<FormTokenField
				className="patterns-menu-items__convert-modal-categories"
				value={ values }
				suggestions={ suggestions }
				onChange={ handleChange }
				onInputChange={ debouncedSearch }
				maxSuggestions={ MAX_TERMS_SUGGESTIONS }
				label={ __( 'Categories' ) }
				tokenizeOnBlur={ true }
			/>
		</>
	);
}
