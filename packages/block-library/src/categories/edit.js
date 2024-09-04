/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	PanelBody,
	Placeholder,
	Spinner,
	ToggleControl,
	VisuallyHidden,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	InspectorControls,
	useBlockProps,
	RichText,
} from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { pin } from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';

export default function CategoriesEdit( {
	attributes: {
		displayAsDropdown,
		showHierarchy,
		showPostCounts,
		showOnlyTopLevel,
		showEmpty,
		label,
		showLabel,
		taxonomy,
	},
	setAttributes,
	className,
} ) {
	const selectId = useInstanceId( CategoriesEdit, 'blocks-category-select' );
	const query = { per_page: -1, hide_empty: ! showEmpty, context: 'view' };
	if ( showOnlyTopLevel ) {
		query.parent = 0;
	}

	const { records: categories, isResolving } = useEntityRecords(
		'taxonomy',
		taxonomy,
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

	const toggleAttribute = ( attributeName ) => ( newValue ) =>
		setAttributes( { [ attributeName ]: newValue } );

	const renderCategoryName = ( name ) =>
		! name ? __( '(Untitled)' ) : decodeEntities( name ).trim();

	const renderCategoryList = () => {
		const parentId = showHierarchy ? 0 : null;
		const categoriesList = getCategoriesList( parentId );
		return categoriesList.map( ( category ) =>
			renderCategoryListItem( category )
		);
	};

	const renderCategoryListItem = ( category ) => {
		const childCategories = getCategoriesList( category.id );
		const { id, link, count, name } = category;
		return (
			<li key={ id } className={ `cat-item cat-item-${ id }` }>
				<a href={ link } target="_blank" rel="noreferrer noopener">
					{ renderCategoryName( name ) }
				</a>
				{ showPostCounts && ` (${ count })` }
				{ showHierarchy && !! childCategories.length && (
					<ul className="children">
						{ childCategories.map( ( childCategory ) =>
							renderCategoryListItem( childCategory )
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
				{ showLabel ? (
					<RichText
						className="wp-block-categories__label"
						aria-label={ __( 'Label text' ) }
						placeholder={ __( 'Categories' ) }
						withoutInteractiveFormatting
						value={ label }
						onChange={ ( html ) =>
							setAttributes( { label: html } )
						}
					/>
				) : (
					<VisuallyHidden as="label" htmlFor={ selectId }>
						{ label ? label : __( 'Categories' ) }
					</VisuallyHidden>
				) }
				<select id={ selectId }>
					<option>{ __( 'Select Category' ) }</option>
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
			<option key={ id } className={ `level-${ level }` }>
				{ Array.from( { length: level * 3 } ).map( () => '\xa0' ) }
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

	const TagName =
		!! categories?.length && ! displayAsDropdown && ! isResolving
			? 'ul'
			: 'div';

	const classes = clsx( className, {
		'wp-block-categories-list':
			!! categories?.length && ! displayAsDropdown && ! isResolving,
		'wp-block-categories-dropdown':
			!! categories?.length && displayAsDropdown && ! isResolving,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );

	return (
		<TagName { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display as dropdown' ) }
						checked={ displayAsDropdown }
						onChange={ toggleAttribute( 'displayAsDropdown' ) }
					/>
					{ displayAsDropdown && (
						<ToggleControl
							__nextHasNoMarginBottom
							className="wp-block-categories__indentation"
							label={ __( 'Show label' ) }
							checked={ showLabel }
							onChange={ toggleAttribute( 'showLabel' ) }
						/>
					) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show post counts' ) }
						checked={ showPostCounts }
						onChange={ toggleAttribute( 'showPostCounts' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show only top level categories' ) }
						checked={ showOnlyTopLevel }
						onChange={ toggleAttribute( 'showOnlyTopLevel' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show empty categories' ) }
						checked={ showEmpty }
						onChange={ toggleAttribute( 'showEmpty' ) }
					/>
					{ ! showOnlyTopLevel && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show hierarchy' ) }
							checked={ showHierarchy }
							onChange={ toggleAttribute( 'showHierarchy' ) }
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
		</TagName>
	);
}
