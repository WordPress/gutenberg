/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';
import {
	Toolbar,
	Dropdown,
	ToolbarButton,
	RangeControl,
	TextControl,
	FormTokenField,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getTermsInfo } from '../utils';
import { MAX_FETCHED_TERMS } from '../constants';

export default function QueryToolbar( { query, setQuery } ) {
	const { categories, tags } = useSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );
		const termsQuery = { per_page: MAX_FETCHED_TERMS };
		const _categories = getEntityRecords(
			'taxonomy',
			'category',
			termsQuery
		);
		const _tags = getEntityRecords( 'taxonomy', 'post_tag', termsQuery );
		return {
			categories: getTermsInfo( _categories ),
			tags: getTermsInfo( _tags ),
		};
	}, [] );
	const [ querySearch, setQuerySearch ] = useState( query.search );
	const onChangeDebounced = useCallback(
		debounce( () => setQuery( { search: querySearch } ), 250 ),
		[ querySearch ]
	);
	useEffect( () => {
		onChangeDebounced();
		return onChangeDebounced.cancel;
	}, [ querySearch, onChangeDebounced ] );

	// Handles categories and tags changes.
	const onTermsChange = ( terms, queryProperty ) => ( newTermValues ) => {
		const termIds = newTermValues.reduce( ( accumulator, termValue ) => {
			const termId = termValue?.id || terms.mapByName[ termValue ]?.id;
			if ( termId ) accumulator.push( termId );
			return accumulator;
		}, [] );
		setQuery( { [ queryProperty ]: termIds } );
	};
	const onCategoriesChange = onTermsChange( categories, 'categoryIds' );
	const onTagsChange = onTermsChange( tags, 'tagIds' );

	return (
		<Toolbar>
			<Dropdown
				renderToggle={ ( { onToggle } ) => (
					<ToolbarButton
						icon={ postList }
						label={ __( 'Query' ) }
						onClick={ onToggle }
					/>
				) }
				renderContent={ () => (
					<>
						<RangeControl
							label={ __( 'Posts per Page' ) }
							min={ 1 }
							allowReset
							value={ query.perPage }
							onChange={ ( value ) =>
								setQuery( { perPage: value ?? -1 } )
							}
						/>
						<RangeControl
							label={ __( 'Number of Pages' ) }
							min={ 1 }
							allowReset
							value={ query.pages }
							onChange={ ( value ) =>
								setQuery( { pages: value ?? -1 } )
							}
						/>
						<RangeControl
							label={ __( 'Offset' ) }
							min={ 0 }
							allowReset
							value={ query.offset }
							onChange={ ( value ) =>
								setQuery( { offset: value ?? 0 } )
							}
						/>
						{ categories?.terms && (
							<FormTokenField
								label={ __( 'Categories' ) }
								value={ query.categoryIds.map(
									( categoryId ) => ( {
										id: categoryId,
										value:
											categories.mapById[ categoryId ]
												.name,
									} )
								) }
								suggestions={ categories.names }
								onChange={ onCategoriesChange }
							/>
						) }
						{ tags?.terms && (
							<FormTokenField
								label={ __( 'Tags' ) }
								value={ ( query.tagIds || [] ).map(
									( tagId ) => ( {
										id: tagId,
										value: tags.mapById[ tagId ].name,
									} )
								) }
								suggestions={ tags.names }
								onChange={ onTagsChange }
							/>
						) }
						<TextControl
							label={ __( 'Search' ) }
							value={ querySearch }
							onChange={ ( value ) => setQuerySearch( value ) }
						/>
					</>
				) }
			/>
		</Toolbar>
	);
}
