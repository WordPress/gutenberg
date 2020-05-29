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
	const CREATE_EMPTY_OPTION_VALUE = '__CREATE_EMPTY__';
	const CREATE_FROM_PAGES_OPTION_VALUE = '__CREATE_FROM_PAGES__';

	//
	// HOOKS
	//

	const ref = useRef();
	const [ selectedMenu, setSelectedMenu ] = useState( null );
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
	const defaultPagesNavigationItems = useMemo( () => {
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

	const menuItems = getMenuItems( selectedMenu?.key );

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
		updateNavItemBlocks( defaultPagesNavigationItems );
		selectBlock( clientId );
	}

	function handleCreateFromMenu() {
		// Create an empty Nav Block if:
		// i. the selected Menu has no items
		// ii. the selected Menu is the "CREATE_EMPTY" placeholder option

		if (
			( selectedMenu && selectedMenu === CREATE_EMPTY_OPTION_VALUE ) ||
			! navLinkBlocksFromMenuItems ||
			! navLinkBlocksFromMenuItems.length
		) {
			return handleCreateEmpty();
		}

		updateNavItemBlocks( navLinkBlocksFromMenuItems );
		selectBlock( clientId );
	}

	const hasPages = hasResolvedPages && pages && pages.length;
	const hasMenus = hasResolvedMenus && menus && menus.length;

	const placeHolderInstructionText = hasMenus
		? __( 'Create a Navigation from all existing pages, or chose a Menu.' )
		: __(
				'Create a Navigation from all existing pages, or create an empty one.'
		  );

	const menuOptions =
		!! menus && menus.length
			? [
					{
						key: '',
						name: __( 'Select where to start from…' ),
					},
					...menus,
					{
						key: '',
						name: '------------------',
						disabled: true,
					},
					{
						key: CREATE_EMPTY_OPTION_VALUE,
						name: __( 'Create empty menu' ),
					},
					...( hasPages
						? [
								{
									key: CREATE_FROM_PAGES_OPTION_VALUE,
									name: __(
										'Create from all top-level pages'
									),
								},
						  ]
						: [] ),
			  ]
			: [
					{
						key: '',
						name: __( 'Select where to start from…' ),
					},
					{
						key: CREATE_EMPTY_OPTION_VALUE,
						name: __( 'Create empty menu' ),
					},
					...( hasPages
						? [
								{
									key: CREATE_FROM_PAGES_OPTION_VALUE,
									name: __(
										'Create from all top-level pages'
									),
								},
						  ]
						: [] ),
			  ];

	// If we don't have existing items or the User hasn't
	// indicated they want to automatically add top level Pages
	// then show the Placeholder
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
						<Button
							isPrimary
							className="wp-block-navigation-placeholder__button"
							onClick={ handleCreateFromExistingPages }
							disabled={ ! hasPages }
						>
							{ __( 'Create from all top-level pages' ) }
						</Button>

						{ !! hasMenus && (
							<>
								<CustomSelectControl
									label={ __( 'Create from existing Menu' ) }
									hideLabelFromVision={ true }
									value={ selectedMenu || menuOptions[ 0 ] }
									onChange={ ( { selectedItem } ) => {
										setSelectedMenu( selectedItem );
									} }
									options={ menuOptions.map(
										( mappedMenu ) => {
											return {
												name: mappedMenu.name,
												key: mappedMenu.id,
												disabled: mappedMenu.disabled,
											};
										}
									) }
								/>
								<Button
									isSecondary
									className="wp-block-navigation-placeholder__button"
									onClick={ () => {
										if ( ! selectedMenu ) {
											return;
										}
										handleCreateFromMenu();
									} }
									disabled={ ! selectedMenu }
								>
									{ __( 'Create' ) }
								</Button>
							</>
						) }

						{ ! hasMenus && (
							<Button
								isLink
								className="wp-block-navigation-placeholder__button"
								onClick={ handleCreateEmpty }
							>
								{ __( 'Create empty' ) }
							</Button>
						) }
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
			[ 'root', 'menu-Item' ],
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
				select( 'core/data' ).isResolving( ...menuItemsSelect );
			},
			hasResolvedPages: select( 'core/data' ).hasFinishedResolution(
				...pagesSelect
			),
			hasResolvedMenus: select( 'core/data' ).hasFinishedResolution(
				...menusSelect
			),
			hasResolvedMenuItems: () => {
				select( 'core/data' ).hasFinishedResolution(
					...menuItemsSelect
				);
			},
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateNavItemBlocks( blocks ) {
				if ( ! blocks || blocks.length === 0 ) return false;
				dispatch( 'core/block-editor' ).replaceInnerBlocks(
					clientId,
					blocks
				);
			},
		};
	} ),
] )( Navigation );
