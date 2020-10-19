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
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getTermsInfo } from '../utils';
import { MAX_FETCHED_TERMS } from '../constants';

export default function QueryInspectorControls( { query, setQuery } ) {
	const { order, orderBy, author: selectedAuthorId, postType } = query;
	const [ showCategories, setShowCategories ] = useState( true );
	const [ showTags, setShowTags ] = useState( true );
	const { authorList, categories, tags, postTypes } = useSelect(
		( select ) => {
			const { getEntityRecords, getPostTypes } = select( 'core' );
			const termsQuery = { per_page: MAX_FETCHED_TERMS };
			const _categories = getEntityRecords(
				'taxonomy',
				'category',
				termsQuery
			);
			const _tags = getEntityRecords(
				'taxonomy',
				'post_tag',
				termsQuery
			);
			const excludedPostTypes = [ 'attachment' ];
			const filteredPostTypes = getPostTypes()?.filter(
				( { viewable, slug } ) =>
					viewable && ! excludedPostTypes.includes( slug )
			);
			return {
				categories: getTermsInfo( _categories ),
				tags: getTermsInfo( _tags ),
				authorList: getEntityRecords( 'root', 'user', {
					per_page: -1,
				} ),
				postTypes: filteredPostTypes,
			};
		},
		[]
	);
	const postTypesTaxonomiesMap = useMemo( () => {
		if ( ! postTypes?.length ) return;
		return postTypes.reduce( ( accumulator, type ) => {
			accumulator[ type.slug ] = type.taxonomies;
			return accumulator;
		}, {} );
	}, [ postTypes ] );
	useEffect( () => {
		if ( ! postTypesTaxonomiesMap ) return;
		const postTypeTaxonomies = postTypesTaxonomiesMap[ postType ];
		setShowCategories( postTypeTaxonomies.includes( 'category' ) );
		setShowTags( postTypeTaxonomies.includes( 'post_tag' ) );
	}, [ postType, postTypesTaxonomiesMap ] );
	const postTypesSelectOptions = useMemo(
		() =>
			( postTypes || [] ).map( ( { labels, slug } ) => ( {
				label: labels.singular_name,
				value: slug,
			} ) ),
		[ postTypes ]
	);
	const onPostTypeChange = ( newValue ) => {
		const updateQuery = { postType: newValue };
		if ( ! postTypesTaxonomiesMap[ newValue ].includes( 'category' ) ) {
			updateQuery.categoryIds = [];
		}
		if ( ! postTypesTaxonomiesMap[ newValue ].includes( 'post_tag' ) ) {
			updateQuery.tagIds = [];
		}
		setQuery( updateQuery );
	};
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
			<PanelBody title={ __( 'Filtering and Sorting' ) }>
				<SelectControl
					options={ postTypesSelectOptions }
					value={ postType }
					label={ __( 'Post Type' ) }
					onChange={ onPostTypeChange }
				/>
				{ showCategories && categories?.terms?.length > 0 && (
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
				{ showTags && tags?.terms?.length > 0 && (
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
				<TextControl
					label={ __( 'Search' ) }
					value={ querySearch }
					onChange={ setQuerySearch }
				/>
			</PanelBody>
		</InspectorControls>
	);
}
