/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { FormTokenField, SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
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

export default function CategorySelector( {
	selectedCategoryValue,
	newCategoryValues,
	onChangeNewCategories,
	onChangeSelectedCategory,
} ) {
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

	const { corePatternCategories, userPatternCategories } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			const { getUserPatternCategories } = select( coreStore );

			return {
				corePatternCategories:
					getSettings().__experimentalBlockPatternCategories,
				userPatternCategories: getUserPatternCategories(),
			};
		}
	);

	const categoryOptions = userPatternCategories.map( ( category ) => ( {
		label: category.label,
		value: category.label,
	} ) );

	corePatternCategories.forEach( ( category ) => {
		if (
			! categoryOptions.find( ( cat ) => cat.label === category.label ) &&
			category.name !== 'query'
		) {
			categoryOptions.push( {
				label: category.label,
				value: category.label,
			} );
		}
	} );

	categoryOptions.unshift( {
		value: '',
		label: __( 'Select a category' ),
		disabled: true,
	} );

	categoryOptions.sort( ( a, b ) => a.label.localeCompare( b.label ) );

	const suggestions = useMemo( () => {
		return ( searchResults ?? [] ).map( ( term ) =>
			unescapeString( term.name )
		);
	}, [ searchResults ] );

	function handleChangeAdd( termNames ) {
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

		onChangeNewCategories( uniqueTerms );
	}

	function handleOnChangeSelect( selectedCategory ) {
		onChangeSelectedCategory( selectedCategory );
	}

	return (
		<>
			<SelectControl
				label={ __( 'Category' ) }
				onChange={ handleOnChangeSelect }
				options={ categoryOptions }
				size="__unstable-large"
				value={ selectedCategoryValue }
			/>

			<FormTokenField
				className="patterns-menu-items__convert-modal-categories"
				value={ newCategoryValues }
				suggestions={ suggestions }
				onChange={ handleChangeAdd }
				onInputChange={ debouncedSearch }
				maxSuggestions={ MAX_TERMS_SUGGESTIONS }
				label={ __( 'Add a new category' ) }
				tokenizeOnBlur={ true }
			/>
		</>
	);
}
