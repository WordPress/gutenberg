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
	RangeControl,
	ToggleControl,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import OrderControl from './order-control';
import { getTermsInfo, usePostTypes } from '../../utils';
import { MAX_FETCHED_TERMS } from '../../constants';

const stickyOptions = [
	{ label: __( 'Include' ), value: '' },
	{ label: __( 'Exclude' ), value: 'exclude' },
	{ label: __( 'Only' ), value: 'only' },
];

// Helper function to get the term id based on user input in terms `FormTokenField`.
const getTermIdByTermValue = ( termsMappedByName, termValue ) => {
	// First we check for exact match by `term.id` or case sensitive `term.name` match.
	const termId = termValue?.id || termsMappedByName[ termValue ]?.id;
	if ( termId ) return termId;
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
	for ( const term in termsMappedByName ) {
		if ( term.toLocaleLowerCase() === termValueLower ) {
			return termsMappedByName[ term ].id;
		}
	}
};

export default function QueryInspectorControls( {
	attributes: { query, displayLayout },
	setQuery,
	setDisplayLayout,
} ) {
	const {
		order,
		orderBy,
		author: selectedAuthorId,
		postType,
		sticky,
		inherit,
	} = query;
	const [ showCategories, setShowCategories ] = useState( true );
	const [ showTags, setShowTags ] = useState( true );
	const [ showSticky, setShowSticky ] = useState( postType === 'post' );
	const { postTypesTaxonomiesMap, postTypesSelectOptions } = usePostTypes();
	const { authorList, categories, tags } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
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
			authorList: getEntityRecords( 'root', 'user', {
				per_page: -1,
			} ),
		};
	}, [] );
	useEffect( () => {
		if ( ! postTypesTaxonomiesMap ) return;
		const postTypeTaxonomies = postTypesTaxonomiesMap[ postType ];
		setShowCategories( postTypeTaxonomies.includes( 'category' ) );
		setShowTags( postTypeTaxonomies.includes( 'post_tag' ) );
	}, [ postType, postTypesTaxonomiesMap ] );
	useEffect( () => {
		setShowSticky( postType === 'post' );
	}, [ postType ] );
	const onPostTypeChange = ( newValue ) => {
		const updateQuery = { postType: newValue };
		if ( ! postTypesTaxonomiesMap[ newValue ].includes( 'category' ) ) {
			updateQuery.categoryIds = [];
		}
		if ( ! postTypesTaxonomiesMap[ newValue ].includes( 'post_tag' ) ) {
			updateQuery.tagIds = [];
		}
		if ( newValue !== 'post' ) {
			updateQuery.sticky = '';
		}
		setQuery( updateQuery );
	};
	// Handles categories and tags changes.
	const onTermsChange = ( terms, queryProperty ) => ( newTermValues ) => {
		const termIds = Array.from(
			newTermValues.reduce( ( accumulator, termValue ) => {
				const termId = getTermIdByTermValue(
					terms.mapByName,
					termValue
				);
				if ( termId ) accumulator.add( termId );
				return accumulator;
			}, new Set() )
		);
		setQuery( { [ queryProperty ]: termIds } );
	};
	const onCategoriesChange = onTermsChange( categories, 'categoryIds' );
	const onTagsChange = onTermsChange( tags, 'tagIds' );

	const [ querySearch, setQuerySearch ] = useState( query.search );
	const onChangeDebounced = useCallback(
		debounce( () => {
			if ( query.search !== querySearch ) {
				setQuery( { search: querySearch } );
			}
		}, 250 ),
		[ querySearch, query.search ]
	);

	useEffect( () => {
		onChangeDebounced();
		return onChangeDebounced.cancel;
	}, [ querySearch, onChangeDebounced ] );

	// Returns only the existing term ids (categories/tags) in proper
	// format to be used in `FormTokenField`. This prevents the component
	// from crashing in the editor, when non existing term ids were provided.
	const getExistingTermsFormTokenValue = ( taxonomy ) => {
		const termsMapper = {
			category: {
				queryProp: 'categoryIds',
				terms: categories,
			},
			post_tag: {
				queryProp: 'tagIds',
				terms: tags,
			},
		};
		const requestedTerm = termsMapper[ taxonomy ];
		return ( query[ requestedTerm.queryProp ] || [] ).reduce(
			( accumulator, termId ) => {
				const term = requestedTerm.terms.mapById[ termId ];
				if ( term ) {
					accumulator.push( {
						id: termId,
						value: term.name,
					} );
				}
				return accumulator;
			},
			[]
		);
	};

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings' ) }>
				<ToggleControl
					label={ __( 'Inherit query from template' ) }
					help={ __(
						'Toggle to use the global query context that is set with the current template, such as an archive or search. Disable to customize the settings independently.'
					) }
					checked={ !! inherit }
					onChange={ ( value ) => setQuery( { inherit: !! value } ) }
				/>
				{ ! inherit && (
					<SelectControl
						options={ postTypesSelectOptions }
						value={ postType }
						label={ __( 'Post type' ) }
						onChange={ onPostTypeChange }
						help={ __(
							'WordPress contains different types of content and they are divided into collections called "Post types". By default there are a few different ones such as blog posts and pages, but plugins could add more.'
						) }
					/>
				) }
				{ displayLayout?.type === 'flex' && (
					<>
						<RangeControl
							label={ __( 'Columns' ) }
							value={ displayLayout.columns }
							onChange={ ( value ) =>
								setDisplayLayout( { columns: value } )
							}
							min={ 2 }
							max={ Math.max( 6, displayLayout.columns ) }
						/>
						{ displayLayout.columns > 6 && (
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'This column count exceeds the recommended amount and may cause visual breakage.'
								) }
							</Notice>
						) }
					</>
				) }
				{ ! inherit && (
					<OrderControl
						{ ...{ order, orderBy } }
						onChange={ setQuery }
					/>
				) }
				{ showSticky && (
					<SelectControl
						label={ __( 'Sticky posts' ) }
						options={ stickyOptions }
						value={ sticky }
						onChange={ ( value ) => setQuery( { sticky: value } ) }
						help={ __(
							'Blog posts can be "stickied", a feature that places them at the top of the front page of posts, keeping it there until new sticky posts are published.'
						) }
					/>
				) }
			</PanelBody>
			{ ! inherit && (
				<PanelBody title={ __( 'Filters' ) }>
					{ showCategories && categories?.terms?.length > 0 && (
						<FormTokenField
							label={ __( 'Categories' ) }
							value={ getExistingTermsFormTokenValue(
								'category'
							) }
							suggestions={ categories.names }
							onChange={ onCategoriesChange }
						/>
					) }
					{ showTags && tags?.terms?.length > 0 && (
						<FormTokenField
							label={ __( 'Tags' ) }
							value={ getExistingTermsFormTokenValue(
								'post_tag'
							) }
							suggestions={ tags.names }
							onChange={ onTagsChange }
						/>
					) }
					<QueryControls
						{ ...{ selectedAuthorId, authorList } }
						onAuthorChange={ ( value ) =>
							setQuery( {
								author: value !== '' ? +value : undefined,
							} )
						}
					/>
					<TextControl
						label={ __( 'Keyword' ) }
						value={ querySearch }
						onChange={ setQuerySearch }
					/>
				</PanelBody>
			) }
		</InspectorControls>
	);
}
