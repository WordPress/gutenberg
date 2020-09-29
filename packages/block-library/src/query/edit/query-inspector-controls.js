/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */

import {
	PanelBody,
	QueryControls,
	TextControl,
	FormTokenField,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getTermsInfo } from '../utils';
import { MAX_FETCHED_TERMS } from '../constants';

export default function QueryInspectorControls( { query, setQuery } ) {
	const { order, orderBy, author: selectedAuthorId } = query;
	const { authorList, categories, tags } = useSelect( ( select ) => {
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
			authorList: getEntityRecords( 'root', 'user', { per_page: -1 } ),
		};
	}, [] );

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

	const [ querySearch, setQuerySearch ] = useState( query.search );
	const onChangeDebounced = useCallback(
		debounce( () => setQuery( { search: querySearch } ), 250 ),
		[ querySearch ]
	);
	useEffect( () => {
		onChangeDebounced();
		return onChangeDebounced.cancel;
	}, [ querySearch, onChangeDebounced ] );
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Sorting and filtering' ) }>
				<QueryControls
					{ ...{ order, orderBy, selectedAuthorId, authorList } }
					onOrderChange={ ( value ) => setQuery( { order: value } ) }
					onOrderByChange={ ( value ) =>
						setQuery( { orderBy: value } )
					}
					onAuthorChange={ ( value ) =>
						setQuery( {
							author: value !== '' ? +value : undefined,
						} )
					}
				/>
				{ categories?.terms?.length > 0 && (
					<FormTokenField
						label={ __( 'Categories' ) }
						value={ ( query.categoryIds || [] ).map(
							( categoryId ) => ( {
								id: categoryId,
								value: categories.mapById[ categoryId ].name,
							} )
						) }
						suggestions={ categories.names }
						onChange={ onCategoriesChange }
					/>
				) }
				{ tags?.terms?.length > 0 && (
					<FormTokenField
						label={ __( 'Tags' ) }
						value={ ( query.tagIds || [] ).map( ( tagId ) => ( {
							id: tagId,
							value: tags.mapById[ tagId ].name,
						} ) ) }
						suggestions={ tags.names }
						onChange={ onTagsChange }
					/>
				) }
				<TextControl
					label={ __( 'Search' ) }
					value={ querySearch }
					onChange={ setQuerySearch }
				/>
			</PanelBody>
		</InspectorControls>
	);
}
