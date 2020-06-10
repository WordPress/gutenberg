/**
 * External dependencies
 */
import { escape, upperFirst } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo, useState, useRef, useCallback } from '@wordpress/element';
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

function LoadingSpinner() {
	return (
		<>
			<Spinner /> { __( 'Loading…' ) }
		</>
	);
}

function Navigation( {
	selectedBlockHasDescendants,
	attributes,
	clientId,
	fontSize,
	hasExistingNavItems,
	hasResolvedPages,
	isImmediateParentOfSelectedBlock,
	isRequestingPages,
	getHasResolvedMenuItems,
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
	const [
		selectedCreateActionOption,
		setSelectedCreateActionOption,
	] = useState( null );
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

	const isRequestingEntities = isRequestingPages || isRequestingMenus;
	const selectedCreateActionOptionKey = selectedCreateActionOption?.key;

	// Builds navigation links from default Pages.
	const buildNavLinkBlocksFromPages = useMemo( () => {
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

	const menuItems = getMenuItems( selectedCreateActionOptionKey );

	// Builds navigation links from selected Menu's items.
	const buildNavLinkBlocksFromMenuItems = useMemo( () => {
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
		updateNavItemBlocks( buildNavLinkBlocksFromPages );
		selectBlock( clientId );
	}

	function handleCreateFromExistingMenu() {
		updateNavItemBlocks( buildNavLinkBlocksFromMenuItems );
		selectBlock( clientId );
	}

	function handleCreate() {
		const { key } = selectedCreateActionOption;

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
			selectedCreateActionOption &&
			buildNavLinkBlocksFromMenuItems?.length
		) {
			return handleCreateFromExistingMenu();
		}

		// Default to empty menu
		return handleCreateEmpty();
	}

	const buildPlaceholderInstructionText = useCallback( () => {
		if ( isRequestingEntities ) {
			return '';
		}

		if ( hasMenus && hasPages ) {
			return __(
				'Create a navigation from all existing pages, or choose a menu.'
			);
		}

		if ( ! hasMenus && ! hasPages ) {
			return __( 'Create an empty Navigation.' );
		}

		if ( hasMenus && ! hasPages ) {
			return __( 'Create a navigation from a menu or create empty.' );
		}

		if ( ! hasMenus && hasPages ) {
			return __(
				'Create a navigation from all existing pages, or create empty.'
			);
		}
	}, [ isRequestingEntities, hasMenus, hasPages ] );

	const createActionOptions = useMemo(
		() => [
			{
				id: CREATE_PLACEHOLDER_VALUE,
				name: __( 'Select where to start from…' ),
			},
			...( hasMenus ? menus : [] ),
			{
				id: CREATE_EMPTY_OPTION_VALUE,
				name: __( 'Create empty menu' ),
				className: 'is-create-empty-option',
			},
			...( hasPages
				? [
						{
							id: CREATE_FROM_PAGES_OPTION_VALUE,
							name: __( 'New from all top-level pages' ),
						},
				  ]
				: [] ),
		],
		[
			CREATE_PLACEHOLDER_VALUE,
			CREATE_EMPTY_OPTION_VALUE,
			CREATE_FROM_PAGES_OPTION_VALUE,
			hasMenus,
			menus,
			hasPages,
		]
	);

	const shouldDisableCreateButton = useCallback( () => {
		// If there is no key at all then disable.
		if ( ! selectedCreateActionOptionKey ) {
			return true;
		}

		// Always disable if the default "placeholder" option is selected.
		if ( selectedCreateActionOptionKey === CREATE_PLACEHOLDER_VALUE ) {
			return true;
		}

		// Always enable if Create Empty is selected.
		if ( selectedCreateActionOptionKey === CREATE_EMPTY_OPTION_VALUE ) {
			return false;
		}

		// Enable if Pages option selected and we have Pages available.
		if (
			selectedCreateActionOptionKey === CREATE_FROM_PAGES_OPTION_VALUE &&
			hasResolvedPages
		) {
			return false;
		}

		// Only "menu" options use an integer based key.
		const selectedOptionIsMenu = Number.isInteger(
			selectedCreateActionOptionKey
		);

		const menuItemsResolved =
			selectedOptionIsMenu &&
			getHasResolvedMenuItems( selectedCreateActionOptionKey );

		return ! menuItemsResolved;
	}, [
		selectedCreateActionOptionKey,
		hasResolvedPages,
		CREATE_PLACEHOLDER_VALUE,
		CREATE_EMPTY_OPTION_VALUE,
		CREATE_FROM_PAGES_OPTION_VALUE,
	] );

	// If we don't have existing items then show the Placeholder
	if ( ! hasExistingNavItems ) {
		return (
			<Block.div>
				<Placeholder
					className="wp-block-navigation-placeholder"
					icon={ icon }
					label={ __( 'Navigation' ) }
					instructions={ buildPlaceholderInstructionText() }
				>
					{ isRequestingEntities ? (
						<div ref={ ref }>
							<LoadingSpinner />
						</div>
					) : (
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
										selectedCreateActionOption ||
										createActionOptions[ 0 ]
									}
									onChange={ ( { selectedItem } ) => {
										if (
											selectedItem?.key ===
											selectedCreateActionOptionKey
										) {
											return;
										}
										setSelectedCreateActionOption(
											selectedItem
										);
									} }
									options={ createActionOptions.map(
										( option ) => {
											return {
												...option,
												key: option.id,
											};
										}
									) }
								/>
								<Button
									isSecondary
									className="wp-block-navigation-placeholder__button"
									onClick={ () => {
										if ( ! selectedCreateActionOption ) {
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
					) }
				</Placeholder>
			</Block.div>
		);
	}

	const blockInlineStyles = {
		fontSize: fontSize.size ? fontSize.size + "px" : undefined,
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
						{ ! hasExistingNavItems && isRequestingEntities && (
							<LoadingSpinner />
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

		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;

		const menusQuery = { per_page: -1 };

		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants,
			hasExistingNavItems: !! innerBlocks.length,
			pages: select( 'core' ).getEntityRecords(
				'postType',
				'page',
				filterDefaultPages
			),
			menus: select( 'core' ).getMenus( menusQuery ),
			isRequestingMenus: select( 'core' ).isResolving( 'getMenus', [
				menusQuery,
			] ),
			hasResolvedMenus: select(
				'core'
			).hasFinishedResolution( 'getMenus', [ menusQuery ] ),
			getMenuItems: ( menuId ) => {
				if ( ! menuId ) {
					return false;
				}

				// If the option is a placeholder or doesn't have a valid
				// id then reject
				if ( ! Number.isInteger( menuId ) ) {
					return false;
				}

				return select( 'core' ).getMenuItems( {
					menus: menuId,
					per_page: -1,
				} );
			},
			getIsRequestingMenuItems: ( menuId ) => {
				return select( 'core' ).isResolving( 'getMenuItems', [
					{
						menus: menuId,
						per_page: -1,
					},
				] );
			},
			getHasResolvedMenuItems: ( menuId ) => {
				return select( 'core' ).hasFinishedResolution( 'getMenuItems', [
					{
						menus: menuId,
						per_page: -1,
					},
				] );
			},

			isRequestingPages: select( 'core/data' ).isResolving(
				...pagesSelect
			),

			hasResolvedPages: select( 'core/data' ).hasFinishedResolution(
				...pagesSelect
			),
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateNavItemBlocks( blocks ) {
				if ( blocks?.length === 0 ) {
					return false;
				}
				dispatch( 'core/block-editor' ).replaceInnerBlocks(
					clientId,
					blocks
				);
			},
		};
	} ),
] )( Navigation );
