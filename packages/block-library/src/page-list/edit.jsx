import clsx from 'clsx';
import { createBlock } from '@wordpress/blocks';
import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	getColorClassName,
	store as blockEditorStore,
	Warning,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	Spinner as WCSpinner,
	Notice as WCNotice,
	ComboboxControl,
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useConvertToNavigationLinks } from './use-convert-to-navigation-links';
import DetachPageListDialog from './detach-dialog';
import { usePageListPages, MAX_PAGE_COUNT } from './use-page-list-pages';
import { PAGE_LIST_ITEM } from './utils';
import { usePageListAllowedBlocks } from './use-page-list-allowed-blocks';
import { useIsPagesOnlyMenu } from '../navigation/use-is-pages-only-menu';
import {
	usePageListChanges,
	getPageListBlocksKey,
} from './use-page-list-changes';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { DEFAULT_BLOCK } from '../navigation/constants';
import { unlock } from '../lock-unlock';

const { useSkipListViewRow } = unlock( blockEditorPrivateApis );

const NOOP = () => {};
const EMPTY_ARRAY = [];
const HIDDEN_METADATA = { blockVisibility: false };

// Shown from both the block toolbar and the Settings panel so the two entry
// points explain the change identically.
function BlockContent( {
	blockProps,
	innerBlocksProps,
	hasResolvedPages,
	blockList,
	pages,
	parentPageID,
} ) {
	if ( ! hasResolvedPages ) {
		return (
			<div { ...blockProps }>
				<div className="wp-block-page-list__loading-indicator-container">
					<WCSpinner className="wp-block-page-list__loading-indicator" />
				</div>
			</div>
		);
	}

	if ( pages === null ) {
		return (
			<div { ...blockProps }>
				<WCNotice status="warning" isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</WCNotice>
			</div>
		);
	}

	if ( pages.length === 0 ) {
		return (
			<div { ...blockProps }>
				<WCNotice status="info" isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</WCNotice>
			</div>
		);
	}

	if ( blockList.length === 0 ) {
		const parentPageDetails = pages.find(
			( page ) => page.id === parentPageID
		);

		if ( parentPageDetails?.title?.rendered ) {
			return (
				<div { ...blockProps }>
					<Warning>
						{ sprintf(
							// translators: %s: Page title.
							__( 'Page List: "%s" page has no children.' ),
							parentPageDetails.title.rendered
						) }
					</Warning>
				</div>
			);
		}

		return (
			<div { ...blockProps }>
				<WCNotice status="warning" isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</WCNotice>
			</div>
		);
	}

	if ( pages.length > 0 ) {
		return <ul { ...innerBlocksProps }></ul>;
	}
}

export default function PageListEdit( {
	context,
	clientId,
	attributes,
	setAttributes,
} ) {
	const { parentPageID, excludedPageIDs = EMPTY_ARRAY } = attributes;
	const [ isConfirmingDetach, setIsConfirmingDetach ] = useState( false );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { pages, pagesByParentId, hasResolvedPages, canReorderPages } =
		usePageListPages();

	const allowConvertToLinks =
		'showSubmenuIcon' in context &&
		pages?.length > 0 &&
		pages?.length <= MAX_PAGE_COUNT;

	const excludedIds = useMemo(
		() => new Set( excludedPageIDs ),
		[ excludedPageIDs ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-page-list', {
			'has-text-color': !! context.textColor,
			[ getColorClassName( 'color', context.textColor ) ]:
				!! context.textColor,
			'has-background': !! context.backgroundColor,
			[ getColorClassName(
				'background-color',
				context.backgroundColor
			) ]: !! context.backgroundColor,
			'open-on-click': context.submenuVisibility === 'click',
			'open-always': context.submenuVisibility === 'always',
		} ),
		style: { ...context.style?.color },
	} );

	const pagesTree = useMemo(
		function makePagesTree( parentId = 0, level = 0 ) {
			const childPages = pagesByParentId.get( parentId );

			if ( ! childPages?.length ) {
				return [];
			}

			return childPages.reduce( ( tree, page ) => {
				const hasChildren = pagesByParentId.has( page.id );
				const item = {
					value: page.id,
					label: '— '.repeat( level ) + page.title.rendered,
					rawName: page.title.rendered,
				};
				tree.push( item );
				if ( hasChildren ) {
					tree.push( ...makePagesTree( page.id, level + 1 ) );
				}
				return tree;
			}, [] );
		},
		[ pagesByParentId ]
	);

	// Hidden pages are listed too, hidden with the standard block visibility
	// setting, so they can be shown again the way any hidden item can.
	const blockList = useMemo(
		function getBlockList( parentId = parentPageID ) {
			const childPages = pagesByParentId.get( parentId );

			if ( ! childPages?.length ) {
				return [];
			}

			return childPages.map( ( page ) => {
				const children = getBlockList( page.id );
				const title =
					// translators: displayed when a page has an empty title.
					page.title?.rendered?.trim() !== ''
						? page.title?.rendered
						: __( '(no title)' );
				return createBlock(
					PAGE_LIST_ITEM,
					{
						id: page.id,
						label: title,
						title,
						link: page.url,
						hasChildren: children.length > 0,
						...( excludedIds.has( page.id ) && {
							metadata: HIDDEN_METADATA,
						} ),
					},
					children
				);
			} );
		},
		[ pagesByParentId, parentPageID, excludedIds ]
	);

	const { parentClientId, isChildOfNavigation, menuClientIds } = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName, getClientIdsOfDescendants } =
				select( blockEditorStore );
			const navigationBlockParents = getBlockParentsByBlockName(
				clientId,
				'core/navigation',
				true
			);
			return {
				isChildOfNavigation: navigationBlockParents.length > 0,
				parentClientId: navigationBlockParents[ 0 ],
				// To tell an item moved among the pages from a new one.
				menuClientIds: navigationBlockParents.length
					? getClientIdsOfDescendants( navigationBlockParents[ 0 ] )
					: EMPTY_ARRAY,
			};
		},
		[ clientId ]
	);

	const convertToNavigationLinks = useConvertToNavigationLinks( {
		clientId,
		parentClientId,
	} );

	const { onChange, changedBlocks, pendingDetach } = usePageListChanges( {
		clientId,
		parentPageID,
		excludedPageIDs,
		pagesByParentId,
		setAttributes,
		menuClientIds,
	} );

	// Once the pages catch up with a change, the changed blocks are kept, so
	// they aren't replaced by blocks with new client IDs, which would lose
	// what's selected and expanded in the list view.
	const innerBlocksValue =
		changedBlocks &&
		( changedBlocks.isHeld ||
			getPageListBlocksKey( changedBlocks.blocks ) ===
				getPageListBlocksKey( blockList ) )
			? changedBlocks.blocks
			: blockList;

	// In a pages menu, only pages can be added or moved, and adding anything
	// else is done by switching to an advanced menu.
	const isPagesOnly = useIsPagesOnlyMenu( parentClientId );
	const allowedBlocks = usePageListAllowedBlocks(
		isChildOfNavigation,
		isPagesOnly
	);

	const innerBlocksProps = useInnerBlocksProps(
		blockProps,
		isChildOfNavigation
			? {
					// Its pages are moved, hidden and added after like the
					// other items of the Navigation block.
					renderAppender: false,
					allowedBlocks,
					...( ! isPagesOnly && {
						defaultBlock: DEFAULT_BLOCK,
						directInsert: true,
					} ),
					templateLock: canReorderPages ? false : 'all',
					onInput: NOOP,
					onChange,
					value: innerBlocksValue,
				}
			: {
					renderAppender: false,
					__unstableDisableDropZone: true,
					allowedBlocks,
					templateLock: 'all',
					onInput: NOOP,
					onChange: NOOP,
					value: blockList,
				}
	);

	// In a Navigation block, its pages are listed as items of the menu, so
	// the Page List itself isn't.
	useSkipListViewRow( isChildOfNavigation );

	return (
		<>
			{ ( pagesTree.length > 0 || allowConvertToLinks ) && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Settings' ) }
						resetAll={ () => {
							setAttributes( { parentPageID: 0 } );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						{ pagesTree.length > 0 && (
							<ToolsPanelItem
								label={ __( 'Parent Page' ) }
								hasValue={ () => parentPageID !== 0 }
								onDeselect={ () =>
									setAttributes( { parentPageID: 0 } )
								}
								isShownByDefault
							>
								<ComboboxControl
									className="editor-page-attributes__parent"
									label={ __( 'Parent' ) }
									value={ parentPageID }
									options={ pagesTree }
									onChange={ ( value ) =>
										setAttributes( {
											parentPageID: value ?? 0,
										} )
									}
									help={ __(
										'Choose a page to show only its subpages.'
									) }
								/>
							</ToolsPanelItem>
						) }

						{ allowConvertToLinks && (
							<Button
								__next40pxDefaultSize
								variant="secondary"
								accessibleWhenDisabled
								disabled={ ! hasResolvedPages }
								onClick={ () => setIsConfirmingDetach( true ) }
								// Not a ToolsPanelItem, so it needs to opt into
								// spanning the panel's two-column grid.
								style={ {
									gridColumn: '1 / -1',
									justifyContent: 'center',
								} }
							>
								{ __( 'Detach Page List' ) }
							</Button>
						) }
					</ToolsPanel>
				</InspectorControls>
			) }
			{ allowConvertToLinks && (
				<>
					<BlockControls group="other">
						<ToolbarButton
							title={ __( 'Detach' ) }
							disabled={ ! hasResolvedPages }
							onClick={ () => setIsConfirmingDetach( true ) }
						>
							{ __( 'Detach' ) }
						</ToolbarButton>
					</BlockControls>
					{ isConfirmingDetach && (
						<DetachPageListDialog
							// Converting a still-resolving list would map over
							// an incomplete (or empty) set of pages.
							isBusy={ ! hasResolvedPages }
							onConfirm={ () => {
								convertToNavigationLinks();
								setIsConfirmingDetach( false );
							} }
							onCancel={ () => setIsConfirmingDetach( false ) }
						/>
					) }
				</>
			) }
			{ pendingDetach && (
				<DetachPageListDialog
					message={ pendingDetach.message }
					onConfirm={ () => {
						convertToNavigationLinks(
							pendingDetach.movedOutClientIds
						);
						pendingDetach.confirm();
					} }
					onCancel={ pendingDetach.cancel }
				/>
			) }
			<BlockContent
				blockProps={ blockProps }
				innerBlocksProps={ innerBlocksProps }
				hasResolvedPages={ hasResolvedPages }
				blockList={ blockList }
				pages={ pages }
				parentPageID={ parentPageID }
			/>
		</>
	);
}
