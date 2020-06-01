/**
 * External dependencies
 */
import { escape, upperFirst } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useState, useRef } from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	FontSizePicker,
	withFontSizes,
	__experimentalUseColors,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';

import { createBlock } from '@wordpress/blocks';
import {
	useSelect,
	useDispatch,
	withSelect,
	withDispatch,
} from '@wordpress/data';
import {
	Button,
	PanelBody,
	Placeholder,
	Spinner,
	ToggleControl,
	Toolbar,
	ToolbarGroup,
	CustomSelectControl,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { navigation as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';
import BlockColorsStyleSelector from './block-colors-selector';
import * as navIcons from './icons';
import createDataTree from './create-data-tree';

// Constants
const CREATE_EMPTY_OPTION_VALUE = '__CREATE_EMPTY__';
const CREATE_FROM_PAGES_OPTION_VALUE = '__CREATE_FROM_PAGES__';
const CREATE_PLACEHOLDER_VALUE = '__CREATE_PLACEHOLDER__';

function Navigation( {
	selectedBlockHasDescendants,
	attributes,
	clientId,
	fontSize,
	hasExistingNavItems,
	hasResolvedPages,
	isImmediateParentOfSelectedBlock,
	isRequestingPages,
	isRequestingMenuItems,
	checkHasResolvedMenuItems,
	hasResolvedMenus,
	isRequestingMenus,
	isSelected,
	pages,
	menus,
	getMenuItems,
	setAttributes,
	setFontSize,
	updateNavItemBlocks,
	className,
} ) {
	//
	// HOOKS
	//
	const ref = useRef();
	const [ selectedDropDownOption, setSelectedDropDownOption ] = useState(
		null
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const { TextColor, BackgroundColor, ColorPanel } = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'has-background' },
		],
		{
			contrastCheckers: [
				{
					backgroundColor: true,
					textColor: true,
					fontSize: fontSize.size,
				},
			],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		},
		[ fontSize.size ]
	);
	const isNavigationManagementScreen = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getSettings()
				.__experimentalNavigationScreen
	);

	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	// Builds navigation links from default Pages.
	const navLinkBlocksFromPages = useMemo( () => {
		if ( ! pages ) {
			return null;
		}

		return pages.map( ( { title, type, link: url, id } ) =>
			createBlock( 'core/navigation-link', {
				type,
				id,
				url,
				label: ! title.rendered
					? __( '(no title)' )
					: escape( title.rendered ),
				opensInNewTab: false,
			} )
		);
	}, [ pages ] );

	const menuItems = getMenuItems( selectedDropDownOption?.key );

	// Builds navigation links from selected Menu's items.
	const navLinkBlocksFromMenuItems = useMemo( () => {
		if ( ! menuItems ) {
			return null;
		}

		function initialiseBlocks( nodes ) {
			return nodes.map( ( { title, type, link: url, id, children } ) => {
				const innerBlocks =
					children && children.length
						? initialiseBlocks( children )
						: [];

				return createBlock(
					'core/navigation-link',
					{
						type,
						id,
						url,
						label: ! title.rendered
							? __( '(no title)' )
							: escape( title.rendered ),
						opensInNewTab: false,
					},
					innerBlocks
				);
			} );
		}

		const menuTree = createDataTree( menuItems );

		const menuBlocksTree = initialiseBlocks( menuTree );

		return menuBlocksTree;
	}, [ menuItems ] );

	const hasPages = !! ( hasResolvedPages && pages?.length );
	const hasMenus = !! ( hasResolvedMenus && menus?.length );

	//
	// HANDLERS
	//
	function handleItemsAlignment( align ) {
		return () => {
			const itemsJustification =
				attributes.itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification,
			} );
		};
	}

	function handleCreateEmpty() {
		const emptyNavLinkBlock = createBlock( 'core/navigation-link' );
		updateNavItemBlocks( [ emptyNavLinkBlock ] );
	}

	function handleCreateFromExistingPages() {
		updateNavItemBlocks( navLinkBlocksFromPages );
		selectBlock( clientId );
	}

	function handleCreateFromExistingMenu() {
		updateNavItemBlocks( navLinkBlocksFromMenuItems );
		selectBlock( clientId );
	}

	function handleCreate() {
		const { key } = selectedDropDownOption;

		// Explicity request to create empty.
		if ( key === CREATE_EMPTY_OPTION_VALUE ) {
			return handleCreateEmpty();
		}

		// Create from Pages.
		if ( hasPages && key === CREATE_FROM_PAGES_OPTION_VALUE ) {
			return handleCreateFromExistingPages();
		}

		// Create from WP Menu (if exists and not empty).
		if (
			hasMenus &&
			selectedDropDownOption &&
			navLinkBlocksFromMenuItems?.length
		) {
			return handleCreateFromExistingMenu();
		}

		// Default to empty menu
		return handleCreateEmpty();
	}

	const placeHolderInstructionText = hasMenus
		? __( 'Create a Navigation from all existing pages, or chose a Menu.' )
		: __(
				'Create a Navigation from all existing pages, or create an empty one.'
		  );

	const dropDownOptions = [
		{
			id: CREATE_PLACEHOLDER_VALUE,
			name: __( 'Select where to start from…' ),
		},
		...( hasMenus ? menus : [] ),
		{
			id: CREATE_EMPTY_OPTION_VALUE,
			name: __( 'Create empty menu' ),
		},
		...( hasPages
			? [
					{
						id: CREATE_FROM_PAGES_OPTION_VALUE,
						name: __( 'New from all top-level pages' ),
					},
			  ]
			: [] ),
	];

	function shouldDisableCreateButton() {
		// If there is no key at all then disable.
		if ( ! selectedDropDownOption?.key ) {
			return true;
		}

		// Always enable if Create Empty is selected.
		if ( selectedDropDownOption.key === CREATE_EMPTY_OPTION_VALUE ) {
			return false;
		}

		// Always disable if the default "placeholder" option is selected.
		if ( selectedDropDownOption.key === CREATE_PLACEHOLDER_VALUE ) {
			return true;
		}

		const menuItemsResolved =
			Number.isInteger( selectedDropDownOption.key ) &&
			checkHasResolvedMenuItems( selectedDropDownOption.key );

		return ! menuItemsResolved;
	}

	// If we don't have existing items then show the Placeholder
	if ( ! hasExistingNavItems ) {
		return (
			<Block.div>
				<Placeholder
					className="wp-block-navigation-placeholder"
					icon={ icon }
					label={ __( 'Navigation' ) }
					instructions={ placeHolderInstructionText }
				>
					<div
						ref={ ref }
						className="wp-block-navigation-placeholder__actions"
					>
						<>
							<CustomSelectControl
								className={ classnames( {
									'has-menus': hasMenus,
								} ) }
								label={ __(
									'Select to create from Pages, existing Menu or empty'
								) }
								hideLabelFromVision={ true }
								value={
									selectedDropDownOption ||
									dropDownOptions[ 0 ]
								}
								onChange={ ( { selectedItem } ) => {
									setSelectedDropDownOption( selectedItem );
								} }
								options={ dropDownOptions.map( ( option ) => {
									return {
										name: option.name,
										key: option.id,
										disabled: option.disabled,
									};
								} ) }
							/>
							<Button
								isSecondary
								className="wp-block-navigation-placeholder__button"
								onClick={ () => {
									if ( ! selectedDropDownOption ) {
										return;
									}
									handleCreate();
								} }
								disabled={ shouldDisableCreateButton() }
							>
								{ __( 'Create' ) }
							</Button>
						</>
					</div>
				</Placeholder>
			</Block.div>
		);
	}

	const blockInlineStyles = {
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	const blockClassNames = classnames( className, {
		[ `items-justified-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
		[ fontSize.class ]: fontSize.class,
		'is-vertical': attributes.orientation === 'vertical',
	} );

	// UI State: rendered Block UI
	return (
		<>
			<BlockControls>
				<Toolbar
					icon={
						attributes.itemsJustification
							? navIcons[
									`justify${ upperFirst(
										attributes.itemsJustification
									) }Icon`
							  ]
							: navIcons.justifyLeftIcon
					}
					label={ __( 'Change items justification' ) }
					isCollapsed
					controls={ [
						{
							icon: navIcons.justifyLeftIcon,
							title: __( 'Justify items left' ),
							isActive: 'left' === attributes.itemsJustification,
							onClick: handleItemsAlignment( 'left' ),
						},
						{
							icon: navIcons.justifyCenterIcon,
							title: __( 'Justify items center' ),
							isActive:
								'center' === attributes.itemsJustification,
							onClick: handleItemsAlignment( 'center' ),
						},
						{
							icon: navIcons.justifyRightIcon,
							title: __( 'Justify items right' ),
							isActive: 'right' === attributes.itemsJustification,
							onClick: handleItemsAlignment( 'right' ),
						},
					] }
				/>
				{ ! isNavigationManagementScreen && (
					<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>
				) }

				<BlockColorsStyleSelector
					TextColor={ TextColor }
					BackgroundColor={ BackgroundColor }
				>
					{ ColorPanel }
				</BlockColorsStyleSelector>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				<PanelBody title={ __( 'Text settings' ) }>
					<FontSizePicker
						value={ fontSize.size }
						onChange={ setFontSize }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={ __( 'Display settings' ) }>
					<ToggleControl
						checked={ attributes.showSubmenuIcon }
						onChange={ ( value ) => {
							setAttributes( { showSubmenuIcon: value } );
						} }
						label={ __( 'Show submenu indicator icons' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<TextColor>
				<BackgroundColor>
					<Block.nav
						className={ blockClassNames }
						style={ blockInlineStyles }
					>
						{ ! hasExistingNavItems &&
							( isRequestingPages ||
								isRequestingMenus ||
								isRequestingMenuItems() ) && (
								<>
									<Spinner /> { __( 'Loading Navigation…' ) }{ ' ' }
								</>
							) }
						<InnerBlocks
							ref={ ref }
							allowedBlocks={ [ 'core/navigation-link' ] }
							renderAppender={
								( isImmediateParentOfSelectedBlock &&
									! selectedBlockHasDescendants ) ||
								isSelected
									? InnerBlocks.DefaultAppender
									: false
							}
							templateInsertUpdatesSelection={ false }
							__experimentalMoverDirection={
								attributes.orientation || 'horizontal'
							}
							__experimentalTagName="ul"
							__experimentalAppenderTagName="li"
							__experimentalPassedProps={ {
								className: 'wp-block-navigation__container',
							} }
							__experimentalCaptureToolbars={ true }
							// Template lock set to false here so that the Nav
							// Block on the experimental menus screen does not
							// inherit templateLock={ 'all' }.
							templateLock={ false }
						/>
					</Block.nav>
				</BackgroundColor>
			</TextColor>
		</>
	);
}

export default compose( [
	withFontSizes( 'fontSize' ),
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );

		const filterDefaultPages = {
			parent: 0,
			order: 'asc',
			orderby: 'id',
		};

		const pagesSelect = [
			'core',
			'getEntityRecords',
			[ 'postType', 'page', filterDefaultPages ],
		];
		const menusSelect = [ 'core', 'getEntityRecords', [ 'root', 'menu' ] ];

		const menuItemsSelect = [
			'core',
			'getEntityRecords',
			[ 'root', 'menu-item' ],
		];

		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;

		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants,
			hasExistingNavItems: !! innerBlocks.length,
			pages: select( 'core' ).getEntityRecords(
				'postType',
				'page',
				filterDefaultPages
			),
			menus: select( 'core' ).getEntityRecords( 'root', 'menu' ),
			getMenuItems: ( menuId ) => {
				if ( ! menuId ) {
					return false;
				}

				// If the option is a placeholder or doesn't have a valid
				// id then reject
				if ( ! Number.isInteger( menuId ) ) {
					return false;
				}

				return select( 'core' ).getEntityRecords( 'root', 'menu-item', {
					menus: menuId,
					per_page: -1,
				} );
			},
			isRequestingPages: select( 'core/data' ).isResolving(
				...pagesSelect
			),
			isRequestingMenus: select( 'core/data' ).isResolving(
				...menusSelect
			),
			isRequestingMenuItems: () => {
				return select( 'core/data' ).isResolving( ...menuItemsSelect );
			},
			hasResolvedPages: select( 'core/data' ).hasFinishedResolution(
				...pagesSelect
			),
			hasResolvedMenus: select( 'core/data' ).hasFinishedResolution(
				...menusSelect
			),
			checkHasResolvedMenuItems: ( menuId ) => {
				return select( 'core/data' ).hasFinishedResolution(
					'core',
					'getEntityRecords',
					[
						'root',
						'menu-item',
						{
							menus: menuId,
							per_page: -1,
						},
					]
				);
			},
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateNavItemBlocks( blocks ) {
				if ( blocks?.length === 0 ) return false;
				dispatch( 'core/block-editor' ).replaceInnerBlocks(
					clientId,
					blocks
				);
			},
		};
	} ),
] )( Navigation );
