/**
 * WordPress dependencies
 */
import {
	TextControl,
	SelectControl,
	Notice,
	__experimentalVStack as VStack,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { debounce } from '@wordpress/compose';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import OrderControl from './order-control';
import AuthorControl from './author-control';
import ParentControl from './parent-control';
import { TaxonomyControls } from './taxonomy-controls';
import FormatControls from './format-controls';
import StickyControl from './sticky-control';
import PerPageControl from './per-page-control';
import OffsetControl from './offset-controls';
import PagesControl from './pages-control';
import {
	usePostTypes,
	useIsPostTypeHierarchical,
	useAllowedControls,
	isControlAllowed,
	useTaxonomies,
	useOrderByOptions,
} from '../../utils';
import { useToolsPanelDropdownMenuProps } from '../../../utils/hooks';

export default function QueryInspectorControls( props ) {
	const { attributes, setQuery, isSingular } = props;
	const { query } = attributes;
	const {
		order,
		orderBy,
		author: authorIds,
		pages,
		postType,
		perPage,
		offset,
		sticky,
		inherit,
		taxQuery,
		parents,
		format,
	} = query;
	const allowedControls = useAllowedControls( attributes );
	const showSticky = postType === 'post';
	const {
		postTypesTaxonomiesMap,
		postTypesSelectOptions,
		postTypeFormatSupportMap,
	} = usePostTypes();
	const taxonomies = useTaxonomies( postType );
	const isPostTypeHierarchical = useIsPostTypeHierarchical( postType );
	const onPostTypeChange = ( newValue ) => {
		const updateQuery = { postType: newValue };
		// We need to dynamically update the `taxQuery` property,
		// by removing any not supported taxonomy from the query.
		const supportedTaxonomies = postTypesTaxonomiesMap[ newValue ];
		if ( !! supportedTaxonomies?.length && !! taxQuery ) {
			// Shared utility to build taxQuery based on supported taxonomies.
			const buildTaxQuery = ( _taxQuery ) => {
				return Object.entries( _taxQuery || {} ).reduce(
					( accumulator, [ taxonomy, terms ] ) => {
						if ( supportedTaxonomies.includes( taxonomy ) ) {
							accumulator[ taxonomy ] = terms;
						}
						return accumulator;
					},
					{}
				);
			};
			const updatedTaxQuery = {};
			const builtIncludeTaxQuery = buildTaxQuery( taxQuery.include );
			if ( !! Object.keys( builtIncludeTaxQuery ).length ) {
				updatedTaxQuery.include = builtIncludeTaxQuery;
			}
			const builtExcludeTaxQuery = buildTaxQuery( taxQuery.exclude );
			if ( !! Object.keys( builtExcludeTaxQuery ).length ) {
				updatedTaxQuery.exclude = builtExcludeTaxQuery;
			}
			updateQuery.taxQuery = !! Object.keys( updatedTaxQuery ).length
				? updatedTaxQuery
				: undefined;
		}

		if ( newValue !== 'post' ) {
			updateQuery.sticky = '';
		}
		// We need to reset `parents` because they are tied to each post type.
		updateQuery.parents = [];
		// Post types can register post format support with `add_post_type_support`.
		// But we need to reset the `format` property when switching to post types
		// that do not support post formats.
		const hasFormatSupport = postTypeFormatSupportMap[ newValue ];
		if ( ! hasFormatSupport ) {
			updateQuery.format = [];
		}

		setQuery( updateQuery );
	};
	const [ querySearch, setQuerySearch ] = useState( query.search );
	const debouncedQuerySearch = useMemo( () => {
		return debounce( ( newQuerySearch ) => {
			setQuery( { search: newQuerySearch } );
		}, 250 );
	}, [ setQuery ] );

	const orderByOptions = useOrderByOptions( postType );
	const showInheritControl = isControlAllowed( allowedControls, 'inherit' );
	const showPostTypeControl =
		! inherit && isControlAllowed( allowedControls, 'postType' );
	const postTypeControlLabel = __( 'Post type' );
	const postTypeControlHelp = __(
		'Select the type of content to display: posts, pages, or custom post types.'
	);
	const showOrderControl =
		! inherit && isControlAllowed( allowedControls, 'order' );
	const showStickyControl =
		! inherit &&
		showSticky &&
		isControlAllowed( allowedControls, 'sticky' );
	const showSettingsPanel =
		showInheritControl ||
		showPostTypeControl ||
		showOrderControl ||
		showStickyControl;
	const showTaxControl =
		!! taxonomies?.length &&
		isControlAllowed( allowedControls, 'taxQuery' );
	const showAuthorControl = isControlAllowed( allowedControls, 'author' );
	const showSearchControl = isControlAllowed( allowedControls, 'search' );
	const showParentControl =
		isControlAllowed( allowedControls, 'parents' ) &&
		isPostTypeHierarchical;

	const postTypeHasFormatSupport = postTypeFormatSupportMap[ postType ];
	const showFormatControl = useSelect(
		( select ) => {
			// Check if the post type supports post formats and if the control is allowed.
			if (
				! postTypeHasFormatSupport ||
				! isControlAllowed( allowedControls, 'format' )
			) {
				return false;
			}

			const themeSupports = select( coreStore ).getThemeSupports();

			// If there are no supported formats, getThemeSupports still includes the default 'standard' format,
			// and in this case the control should not be shown since the user has no other formats to choose from.
			return (
				themeSupports.formats &&
				themeSupports.formats.length > 0 &&
				themeSupports.formats.some( ( type ) => type !== 'standard' )
			);
		},
		[ allowedControls, postTypeHasFormatSupport ]
	);

	const showFiltersPanel =
		showTaxControl ||
		showAuthorControl ||
		showSearchControl ||
		showParentControl ||
		showFormatControl;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const showPostCountControl = isControlAllowed(
		allowedControls,
		'postCount'
	);
	const showOffSetControl = isControlAllowed( allowedControls, 'offset' );
	const showPagesControl = isControlAllowed( allowedControls, 'pages' );

	const showDisplayPanel =
		showPostCountControl || showOffSetControl || showPagesControl;

	// The block cannot inherit a default WordPress query in singular content (e.g., post, page, 404, blank).
	// Warn users but still permit this type of query for exceptional cases in Classic and Hybrid themes.
	const hasInheritanceWarning = isSingular && inherit;

	return (
		<>
			{ showSettingsPanel && (
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setQuery( {
							postType: 'post',
							order: 'desc',
							orderBy: 'date',
							sticky: '',
							inherit: true,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ showInheritControl && (
						<ToolsPanelItem
							hasValue={ () => ! inherit }
							label={ __( 'Query type' ) }
							onDeselect={ () => setQuery( { inherit: true } ) }
							isShownByDefault
						>
							<VStack spacing={ 4 }>
								<ToggleGroupControl
									__next40pxDefaultSize
									label={ __( 'Query type' ) }
									isBlock
									onChange={ ( value ) => {
										setQuery( {
											inherit: value === 'default',
										} );
									} }
									help={
										inherit
											? __(
													'Display a list of posts or custom post types based on the current template.'
											  )
											: __(
													'Display a list of posts or custom post types based on specific criteria.'
											  )
									}
									value={ !! inherit ? 'default' : 'custom' }
								>
									<ToggleGroupControlOption
										value="default"
										label={ __( 'Default' ) }
									/>
									<ToggleGroupControlOption
										value="custom"
										label={ __( 'Custom' ) }
									/>
								</ToggleGroupControl>
								{ hasInheritanceWarning && (
									<Notice
										status="warning"
										isDismissible={ false }
									>
										{ __(
											'Cannot inherit the current template query when placed inside the singular content (e.g., post, page, 404, blank).'
										) }
									</Notice>
								) }
							</VStack>
						</ToolsPanelItem>
					) }

					{ showPostTypeControl && (
						<ToolsPanelItem
							hasValue={ () => postType !== 'post' }
							label={ postTypeControlLabel }
							onDeselect={ () => onPostTypeChange( 'post' ) }
							isShownByDefault
						>
							{ postTypesSelectOptions.length > 2 ? (
								<SelectControl
									__next40pxDefaultSize
									options={ postTypesSelectOptions }
									value={ postType }
									label={ postTypeControlLabel }
									onChange={ onPostTypeChange }
									help={ postTypeControlHelp }
								/>
							) : (
								<ToggleGroupControl
									__next40pxDefaultSize
									isBlock
									value={ postType }
									label={ postTypeControlLabel }
									onChange={ onPostTypeChange }
									help={ postTypeControlHelp }
								>
									{ postTypesSelectOptions.map(
										( option ) => (
											<ToggleGroupControlOption
												key={ option.value }
												value={ option.value }
												label={ option.label }
											/>
										)
									) }
								</ToggleGroupControl>
							) }
						</ToolsPanelItem>
					) }

					{ showOrderControl && (
						<ToolsPanelItem
							hasValue={ () =>
								order !== 'desc' || orderBy !== 'date'
							}
							label={ __( 'Order by' ) }
							onDeselect={ () =>
								setQuery( { order: 'desc', orderBy: 'date' } )
							}
							isShownByDefault
						>
							<OrderControl
								{ ...{ order, orderBy, orderByOptions } }
								onChange={ setQuery }
							/>
						</ToolsPanelItem>
					) }

					{ showStickyControl && (
						<ToolsPanelItem
							hasValue={ () => !! sticky }
							label={ __( 'Sticky posts' ) }
							onDeselect={ () => setQuery( { sticky: '' } ) }
							isShownByDefault
						>
							<StickyControl
								value={ sticky }
								onChange={ ( value ) =>
									setQuery( { sticky: value } )
								}
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			) }
			{ ! inherit && showDisplayPanel && (
				<ToolsPanel
					className="block-library-query-toolspanel__display"
					label={ __( 'Display' ) }
					resetAll={ () => {
						setQuery( {
							offset: 0,
							pages: 0,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Items per page' ) }
						hasValue={ () => perPage > 0 }
					>
						<PerPageControl
							perPage={ perPage }
							offset={ offset }
							onChange={ setQuery }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Offset' ) }
						hasValue={ () => offset > 0 }
						onDeselect={ () => setQuery( { offset: 0 } ) }
					>
						<OffsetControl
							offset={ offset }
							onChange={ setQuery }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Max pages to show' ) }
						hasValue={ () => pages > 0 }
						onDeselect={ () => setQuery( { pages: 0 } ) }
					>
						<PagesControl pages={ pages } onChange={ setQuery } />
					</ToolsPanelItem>
				</ToolsPanel>
			) }
			{ ! inherit && showFiltersPanel && (
				<ToolsPanel
					className="block-library-query-toolspanel__filters" // unused but kept for backward compatibility
					label={ __( 'Filters' ) }
					resetAll={ () => {
						setQuery( {
							author: '',
							parents: [],
							search: '',
							taxQuery: null,
							format: [],
						} );
						setQuerySearch( '' );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ showTaxControl && (
						<ToolsPanelItem
							label={ __( 'Taxonomies' ) }
							hasValue={ () =>
								Object.values( taxQuery || {} ).some(
									( value ) =>
										Object.values( value || {} ).some(
											( termIds ) => !! termIds?.length
										)
								)
							}
							onDeselect={ () => setQuery( { taxQuery: null } ) }
						>
							<TaxonomyControls
								onChange={ setQuery }
								query={ query }
							/>
						</ToolsPanelItem>
					) }
					{ showAuthorControl && (
						<ToolsPanelItem
							hasValue={ () => !! authorIds }
							label={ __( 'Authors' ) }
							onDeselect={ () => setQuery( { author: '' } ) }
						>
							<AuthorControl
								value={ authorIds }
								onChange={ setQuery }
							/>
						</ToolsPanelItem>
					) }
					{ showSearchControl && (
						<ToolsPanelItem
							hasValue={ () => !! querySearch }
							label={ __( 'Keyword' ) }
							onDeselect={ () => {
								setQuery( { search: '' } );
								setQuerySearch( '' );
							} }
						>
							<TextControl
								__next40pxDefaultSize
								label={ __( 'Keyword' ) }
								value={ querySearch }
								onChange={ ( newQuerySearch ) => {
									debouncedQuerySearch( newQuerySearch );
									setQuerySearch( newQuerySearch );
								} }
							/>
						</ToolsPanelItem>
					) }
					{ showParentControl && (
						<ToolsPanelItem
							hasValue={ () => !! parents?.length }
							label={ __( 'Parents' ) }
							onDeselect={ () => setQuery( { parents: [] } ) }
						>
							<ParentControl
								parents={ parents }
								postType={ postType }
								onChange={ setQuery }
							/>
						</ToolsPanelItem>
					) }
					{ showFormatControl && (
						<ToolsPanelItem
							hasValue={ () => !! format?.length }
							label={ __( 'Formats' ) }
							onDeselect={ () => setQuery( { format: [] } ) }
						>
							<FormatControls
								onChange={ setQuery }
								query={ query }
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			) }
		</>
	);
}
