/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Placeholder,
	SelectControl,
	Spinner,
	ToggleControl,
	VisuallyHidden,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	InspectorControls,
	useBlockProps,
	RichText,
} from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { pin } from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { store as noticeStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function CategoriesEdit( {
	attributes: {
		displayAsDropdown,
		showHierarchy,
		showPostCounts,
		showOnlyTopLevel,
		showEmpty,
		label,
		showLabel,
		taxonomy: taxonomySlug,
	},
	setAttributes,
	className,
	clientId,
} ) {
	const selectId = useInstanceId( CategoriesEdit, 'blocks-category-select' );

	const { records: allTaxonomies, isResolvingTaxonomies } = useEntityRecords(
		'root',
		'taxonomy',
		{ per_page: -1 }
	);

	const taxonomies = allTaxonomies?.filter( ( t ) => t.visibility.public );

	const taxonomy = taxonomies?.find( ( t ) => t.slug === taxonomySlug );

	const isHierarchicalTaxonomy =
		! isResolvingTaxonomies && taxonomy?.hierarchical;

	const query = { per_page: -1, hide_empty: ! showEmpty, context: 'view' };
	if ( isHierarchicalTaxonomy && showOnlyTopLevel ) {
		query.parent = 0;
	}

	const { records: categories, isResolving } = useEntityRecords(
		'taxonomy',
		taxonomySlug,
		query
	);

	const { createWarningNotice } = useDispatch( noticeStore );
	const showRedirectionPreventedNotice = ( event ) => {
		event.preventDefault();
		createWarningNotice( __( 'Links are disabled in the editor.' ), {
			id: `block-library/core/categories/redirection-prevented/${ clientId }`,
			type: 'snackbar',
		} );
	};

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
		const parentId = isHierarchicalTaxonomy && showHierarchy ? 0 : null;
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
				<a href={ link } onClick={ showRedirectionPreventedNotice }>
					{ renderCategoryName( name ) }
				</a>
				{ showPostCounts && ` (${ count })` }
				{ isHierarchicalTaxonomy &&
					showHierarchy &&
					!! childCategories.length && (
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
		const parentId = isHierarchicalTaxonomy && showHierarchy ? 0 : null;
		const categoriesList = getCategoriesList( parentId );
		return (
			<>
				{ showLabel ? (
					<RichText
						className="wp-block-categories__label"
						aria-label={ __( 'Label text' ) }
						placeholder={ taxonomy?.name }
						withoutInteractiveFormatting
						value={ label }
						onChange={ ( html ) =>
							setAttributes( { label: html } )
						}
					/>
				) : (
					<VisuallyHidden as="label" htmlFor={ selectId }>
						{ label ? label : taxonomy?.name }
					</VisuallyHidden>
				) }
				<select id={ selectId }>
					<option>
						{ sprintf(
							/* translators: %s: taxonomy's singular name */
							__( 'Select %s' ),
							taxonomy?.labels?.singular_name
						) }
					</option>
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
			isHierarchicalTaxonomy &&
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

	const classes = clsx(
		className,
		`wp-block-categories-taxonomy-${ taxonomySlug }`,
		{
			'wp-block-categories-list':
				!! categories?.length && ! displayAsDropdown && ! isResolving,
			'wp-block-categories-dropdown':
				!! categories?.length && displayAsDropdown && ! isResolving,
		}
	);

	const blockProps = useBlockProps( {
		className: classes,
	} );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<TagName { ...blockProps }>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							taxonomy: 'category',
							displayAsDropdown: false,
							showHierarchy: false,
							showPostCounts: false,
							showOnlyTopLevel: false,
							showEmpty: false,
							showLabel: true,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ Array.isArray( taxonomies ) && (
						<ToolsPanelItem
							hasValue={ () => {
								return taxonomySlug !== 'category';
							} }
							label={ __( 'Taxonomy' ) }
							onDeselect={ () => {
								setAttributes( { taxonomy: 'category' } );
							} }
							isShownByDefault
						>
							<SelectControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Taxonomy' ) }
								options={ taxonomies.map( ( t ) => ( {
									label: t.name,
									value: t.slug,
								} ) ) }
								value={ taxonomySlug }
								onChange={ ( selectedTaxonomy ) =>
									setAttributes( {
										taxonomy: selectedTaxonomy,
									} )
								}
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						hasValue={ () => !! displayAsDropdown }
						label={ __( 'Display as dropdown' ) }
						onDeselect={ () =>
							setAttributes( { displayAsDropdown: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display as dropdown' ) }
							checked={ displayAsDropdown }
							onChange={ toggleAttribute( 'displayAsDropdown' ) }
						/>
					</ToolsPanelItem>
					{ displayAsDropdown && (
						<ToolsPanelItem
							hasValue={ () => ! showLabel }
							label={ __( 'Show label' ) }
							onDeselect={ () =>
								setAttributes( { showLabel: true } )
							}
							isShownByDefault
						>
							<ToggleControl
								__nextHasNoMarginBottom
								className="wp-block-categories__indentation"
								label={ __( 'Show label' ) }
								checked={ showLabel }
								onChange={ toggleAttribute( 'showLabel' ) }
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						hasValue={ () => !! showPostCounts }
						label={ __( 'Show post counts' ) }
						onDeselect={ () =>
							setAttributes( { showPostCounts: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show post counts' ) }
							checked={ showPostCounts }
							onChange={ toggleAttribute( 'showPostCounts' ) }
						/>
					</ToolsPanelItem>
					{ isHierarchicalTaxonomy && (
						<ToolsPanelItem
							hasValue={ () => !! showOnlyTopLevel }
							label={ __( 'Show only top level terms' ) }
							onDeselect={ () =>
								setAttributes( { showOnlyTopLevel: false } )
							}
							isShownByDefault
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show only top level terms' ) }
								checked={ showOnlyTopLevel }
								onChange={ toggleAttribute(
									'showOnlyTopLevel'
								) }
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						hasValue={ () => !! showEmpty }
						label={ __( 'Show empty terms' ) }
						onDeselect={ () =>
							setAttributes( { showEmpty: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Show empty terms' ) }
							checked={ showEmpty }
							onChange={ toggleAttribute( 'showEmpty' ) }
						/>
					</ToolsPanelItem>
					{ isHierarchicalTaxonomy && ! showOnlyTopLevel && (
						<ToolsPanelItem
							hasValue={ () => !! showHierarchy }
							label={ __( 'Show hierarchy' ) }
							onDeselect={ () =>
								setAttributes( { showHierarchy: false } )
							}
							isShownByDefault
						>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Show hierarchy' ) }
								checked={ showHierarchy }
								onChange={ toggleAttribute( 'showHierarchy' ) }
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
			{ isResolving && (
				<Placeholder icon={ pin } label={ __( 'Terms' ) }>
					<Spinner />
				</Placeholder>
			) }
			{ ! isResolving && categories?.length === 0 && (
				<p>{ taxonomy.labels.no_terms }</p>
			) }
			{ ! isResolving &&
				categories?.length > 0 &&
				( displayAsDropdown
					? renderCategoryDropdown()
					: renderCategoryList() ) }
		</TagName>
	);
}
