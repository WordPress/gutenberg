/**
 * External dependencies
 */
import { times, unescape } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	PanelBody,
	Placeholder,
	Spinner,
	ToggleControl,
	VisuallyHidden,
	RangeControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { pin } from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';

const SHOW_ALL = -1;

// 100 is the max RangeControl supports
const MAX_TERMS_LIMIT = 100;

export default function CategoriesEdit( {
	attributes: {
		displayAsDropdown,
		showHierarchy,
		showPostCounts,
		showOnlyTopLevel,
		showEmpty,
		termsToShow,
	},
	setAttributes,
} ) {
	const selectId = useInstanceId( CategoriesEdit, 'blocks-category-select' );
	const query = {
		per_page: termsToShow,
		hide_empty: ! showEmpty,
		context: 'view',
	};
	if ( showOnlyTopLevel ) {
		query.parent = 0;
	}
	const { records: categories, isResolving } = useEntityRecords(
		'taxonomy',
		'category',
		query
	);

	const getCategoriesList = ( parentId ) => {
		if ( ! categories?.length ) {
			return [];
		}
		if ( parentId === null ) {
			return categories;
		}
		return categories.filter( ( { parent } ) => parent === parentId );
	};
	const getCategoryListClassName = ( level ) => {
		return `wp-block-categories__list wp-block-categories__list-level-${ level }`;
	};
	const toggleAttribute = ( attributeName ) => ( newValue ) =>
		setAttributes( { [ attributeName ]: newValue } );
	const renderCategoryName = ( name ) =>
		! name ? __( '(Untitled)' ) : unescape( name ).trim();

	const renderCategoryList = () => {
		const parentId = showHierarchy ? 0 : null;
		const categoriesList = getCategoriesList( parentId );
		return (
			<ul className={ getCategoryListClassName( 0 ) }>
				{ categoriesList.map( ( category ) =>
					renderCategoryListItem( category, 0 )
				) }
			</ul>
		);
	};
	const renderCategoryListItem = ( category, level ) => {
		const childCategories = getCategoriesList( category.id );
		const { id, link, count, name } = category;
		return (
			<li key={ id }>
				<a href={ link } target="_blank" rel="noreferrer noopener">
					{ renderCategoryName( name ) }
				</a>
				{ showPostCounts && (
					<span className="wp-block-categories__post-count">
						{ ` (${ count })` }
					</span>
				) }
				{ showHierarchy && !! childCategories.length && (
					<ul className={ getCategoryListClassName( level + 1 ) }>
						{ childCategories.map( ( childCategory ) =>
							renderCategoryListItem( childCategory, level + 1 )
						) }
					</ul>
				) }
			</li>
		);
	};
	const renderCategoryDropdown = () => {
		const parentId = showHierarchy ? 0 : null;
		const categoriesList = getCategoriesList( parentId );
		return (
			<>
				<VisuallyHidden as="label" htmlFor={ selectId }>
					{ __( 'Categories' ) }
				</VisuallyHidden>
				<select
					id={ selectId }
					className="wp-block-categories__dropdown"
				>
					{ categoriesList.map( ( category ) =>
						renderCategoryDropdownItem( category, 0 )
					) }
				</select>
			</>
		);
	};
	const renderCategoryDropdownItem = ( category, level ) => {
		const { id, count, name } = category;
		const childCategories = getCategoriesList( id );
		return [
			<option key={ id }>
				{ times( level * 3, () => '\xa0' ) }
				{ renderCategoryName( name ) }
				{ showPostCounts && ` (${ count })` }
			</option>,
			showHierarchy &&
				!! childCategories.length &&
				childCategories.map( ( childCategory ) =>
					renderCategoryDropdownItem( childCategory, level + 1 )
				),
		];
	};

	// Fallback to 1 is required to ensure a valid value
	// for the range control.
	const currentNumberCategories = categories?.length || 1;

	const numberOfItemsToShow =
		termsToShow === SHOW_ALL ? currentNumberCategories : termsToShow;

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						label={ __( 'Display as dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ toggleAttribute( 'displayAsDropdown' ) }
					/>
					<ToggleControl
						label={ __( 'Show post counts' ) }
						checked={ showPostCounts }
						onChange={ toggleAttribute( 'showPostCounts' ) }
					/>
					<ToggleControl
						label={ __( 'Show only top level categories' ) }
						checked={ showOnlyTopLevel }
						onChange={ toggleAttribute( 'showOnlyTopLevel' ) }
					/>
					<ToggleControl
						label={ __( 'Show empty categories' ) }
						checked={ showEmpty }
						onChange={ toggleAttribute( 'showEmpty' ) }
					/>
					{ ! showOnlyTopLevel && (
						<ToggleControl
							label={ __( 'Show hierarchy' ) }
							checked={ showHierarchy }
							onChange={ toggleAttribute( 'showHierarchy' ) }
						/>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Sorting and filtering' ) }>
					<ToggleControl
						label={ __( 'Limit items' ) }
						checked={ termsToShow !== SHOW_ALL }
						onChange={ () => {
							setAttributes( {
								termsToShow:
									termsToShow === SHOW_ALL
										? numberOfItemsToShow
										: SHOW_ALL,
							} );
						} }
					/>
					{ termsToShow !== SHOW_ALL && (
						<RangeControl
							label={ __( 'Number of items' ) }
							value={ numberOfItemsToShow }
							onChange={ ( newValue ) =>
								setAttributes( {
									termsToShow: newValue,
								} )
							}
							min={ 1 }
							max={ MAX_TERMS_LIMIT }
							required
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ isResolving && (
				<Placeholder icon={ pin } label={ __( 'Categories' ) }>
					<Spinner />
				</Placeholder>
			) }
			{ ! isResolving && categories?.length === 0 && (
				<p>
					{ __(
						'Your site does not have any posts, so there is nothing to display here at the moment.'
					) }
				</p>
			) }
			{ ! isResolving &&
				categories?.length > 0 &&
				( displayAsDropdown
					? renderCategoryDropdown()
					: renderCategoryList() ) }
		</div>
	);
}
