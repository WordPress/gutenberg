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
	TextControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
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
import { VisuallyHidden } from '@wordpress/ui';
import { store as noticeStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const DELIMITER_OPTIONS = [
	{ label: __( 'Comma' ), value: 'comma' },
	{ label: __( 'Dot' ), value: 'dot' },
	{ label: __( 'Pipe' ), value: 'pipe' },
	{ label: __( 'Slash' ), value: 'slash' },
	{ label: __( 'Custom' ), value: 'custom' },
];

const DISPLAY_LAYOUT_OPTIONS = [
	{ label: __( 'List' ), value: 'list' },
	{ label: __( 'Dropdown' ), value: 'dropdown' },
	{ label: __( 'Inline' ), value: 'inline' },
];

const DELIMITER_CHARS = {
	comma: ', ',
	dot: ' · ',
	pipe: ' | ',
	slash: ' / ',
};

export default function CategoriesEdit( {
	attributes: {
		displayLayout,
		delimiter,
		customDelimiter,
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

	const renderCategoryInline = () => {
		const delimiterChar =
			delimiter === 'custom'
				? customDelimiter || ','
				: DELIMITER_CHARS[ delimiter ] || DELIMITER_CHARS.comma;
		const parentId = isHierarchicalTaxonomy && showHierarchy ? 0 : null;
		const categoriesList = getCategoriesList( parentId );

		const items = [];
		categoriesList.forEach( ( category, index ) => {
			const { id, link, count, name } = category;
			items.push(
				<span key={ id } className="wp-block-categories__inline-item">
					<a href={ link } onClick={ showRedirectionPreventedNotice }>
						{ renderCategoryName( name ) }
					</a>
					{ showPostCounts && ` (${ count })` }
				</span>
			);
			if ( index < categoriesList.length - 1 ) {
				items.push(
					<span
						key={ `delimiter-${ id }` }
						className="wp-block-categories__inline-delimiter"
						aria-hidden="true"
					>
						{ delimiterChar.trim() }
					</span>
				);
			}
		} );

		return items;
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
					// eslint-disable-next-line jsx-a11y/label-has-associated-control
					<VisuallyHidden render={ <label htmlFor={ selectId } /> }>
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

	const isDropdown = displayLayout === 'dropdown';
	const isInline = displayLayout === 'inline';
	const hasContent = !! categories?.length && ! isResolving;

	let TagName = 'div';
	if ( hasContent && ! isDropdown ) {
		TagName = isInline ? 'div' : 'ul';
	}

	const classes = clsx(
		className,
		`wp-block-categories-taxonomy-${ taxonomySlug }`,
		{
			'wp-block-categories-list':
				!! categories?.length &&
				! isDropdown &&
				! isInline &&
				! isResolving,
			'wp-block-categories-dropdown':
				!! categories?.length && isDropdown && ! isResolving,
			'wp-block-categories-inline':
				!! categories?.length && isInline && ! isResolving,
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
							displayLayout: 'list',
							delimiter: 'comma',
							customDelimiter: '',
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
						hasValue={ () => displayLayout !== 'list' }
						label={ __( 'Display layout' ) }
						onDeselect={ () =>
							setAttributes( { displayLayout: 'list' } )
						}
						isShownByDefault
					>
						<SelectControl
							__next40pxDefaultSize
							label={ __( 'Display layout' ) }
							options={ DISPLAY_LAYOUT_OPTIONS }
							value={ displayLayout }
							onChange={ ( value ) =>
								setAttributes( { displayLayout: value } )
							}
						/>
					</ToolsPanelItem>
					{ isDropdown && (
						<ToolsPanelItem
							hasValue={ () => ! showLabel }
							label={ __( 'Show label' ) }
							onDeselect={ () =>
								setAttributes( { showLabel: true } )
							}
							isShownByDefault
						>
							<ToggleControl
								className="wp-block-categories__indentation"
								label={ __( 'Show label' ) }
								checked={ showLabel }
								onChange={ toggleAttribute( 'showLabel' ) }
							/>
						</ToolsPanelItem>
					) }
					{ isInline && (
						<ToolsPanelItem
							hasValue={ () =>
								delimiter !== 'comma' || customDelimiter
							}
							label={ __( 'Delimiter' ) }
							onDeselect={ () =>
								setAttributes( {
									delimiter: 'comma',
									customDelimiter: '',
								} )
							}
							isShownByDefault
						>
							<VStack spacing={ 2 }>
								<SelectControl
									__next40pxDefaultSize
									label={ __( 'Delimiter' ) }
									options={ DELIMITER_OPTIONS }
									value={ delimiter }
									onChange={ ( value ) =>
										setAttributes( { delimiter: value } )
									}
								/>
								{ delimiter === 'custom' && (
									<TextControl
										__next40pxDefaultSize
										label={ __( 'Custom delimiter' ) }
										value={ customDelimiter }
										onChange={ ( value ) =>
											setAttributes( {
												customDelimiter: value,
											} )
										}
										placeholder={ __( 'e.g., •' ) }
									/>
								) }
							</VStack>
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
							label={ __( 'Show empty terms' ) }
							checked={ showEmpty }
							onChange={ toggleAttribute( 'showEmpty' ) }
						/>
					</ToolsPanelItem>
					{ isHierarchicalTaxonomy &&
						! showOnlyTopLevel &&
						! isInline && (
							<ToolsPanelItem
								hasValue={ () => !! showHierarchy }
								label={ __( 'Show hierarchy' ) }
								onDeselect={ () =>
									setAttributes( { showHierarchy: false } )
								}
								isShownByDefault
							>
								<ToggleControl
									label={ __( 'Show hierarchy' ) }
									checked={ showHierarchy }
									onChange={ toggleAttribute(
										'showHierarchy'
									) }
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
			{ ! isResolving && categories?.length > 0 && (
				<>
					{ isDropdown && renderCategoryDropdown() }
					{ isInline && renderCategoryInline() }
					{ ! isDropdown && ! isInline && renderCategoryList() }
				</>
			) }
		</TagName>
	);
}
