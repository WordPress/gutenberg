import clsx from 'clsx';
import { createBlock, getBlockType } from '@wordpress/blocks';
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
	Notice,
	ComboboxControl,
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState, useEffect } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	convertToNavigationLinks as buildNavigationLinks,
	useConvertToNavigationLinks,
} from './use-convert-to-navigation-links';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { DEFAULT_BLOCK } from '../navigation/constants';
import { unlock } from '../lock-unlock';

const { isMoveTransparentKey, detachesOnEditKey } = unlock(
	blockEditorPrivateApis
);

// We only show the detach option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;
const NOOP = () => {};

// Shown from both the block toolbar and the Settings panel so the two entry
// points explain the change identically.
function DetachPageListDialog( { isBusy, onConfirm, onCancel } ) {
	return (
		<ConfirmDialog
			isOpen
			title={ __( 'Detach Page List' ) }
			__experimentalHideHeader={ false }
			confirmButtonText={ __( 'Detach' ) }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			isBusy={ isBusy }
			size="medium"
		>
			{ __(
				"This Navigation Menu displays your website's pages. Detaching will enable you to add, delete, or reorder pages. However, new pages will no longer be added automatically."
			) }
		</ConfirmDialog>
	);
}

function BlockContent( {
	blockProps,
	innerBlocksProps,
	hasResolvedPages,
	blockList,
	pages,
	parentPageID,
} ) {
	// Only before the first result: a refetch (after a page is saved) keeps
	// showing the pages, so the inner blocks and their sync stay mounted.
	if ( ! hasResolvedPages && ! pages ) {
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
				<Notice status="warning" isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</Notice>
			</div>
		);
	}

	if ( pages.length === 0 ) {
		return (
			<div { ...blockProps }>
				<Notice status="info" isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</Notice>
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
				<Notice status="warning" isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</Notice>
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
	const { parentPageID } = attributes;
	const [ isConfirmingDetach, setIsConfirmingDetach ] = useState( false );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const {
		records: pages,
		hasResolved: hasResolvedPages,
		totalItems,
	} = useEntityRecords( 'postType', 'page', {
		per_page: MAX_PAGE_COUNT,
		_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
		// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
		// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
		// sort.
		orderby: 'menu_order',
		order: 'asc',
	} );

	const allowConvertToLinks =
		'showSubmenuIcon' in context &&
		pages?.length > 0 &&
		pages?.length <= MAX_PAGE_COUNT;

	const pagesByParentId = useMemo( () => {
		if ( pages === null ) {
			return new Map();
		}

		// TODO: Once the REST API supports passing multiple values to
		// 'orderby', this can be removed.
		// https://core.trac.wordpress.org/ticket/39037
		const sortedPages = pages.sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return a.title.rendered.localeCompare( b.title.rendered );
			}
			return a.menu_order - b.menu_order;
		} );

		return sortedPages.reduce( ( accumulator, page ) => {
			const { parent } = page;
			if ( accumulator.has( parent ) ) {
				accumulator.get( parent ).push( page );
			} else {
				accumulator.set( parent, [ page ] );
			}
			return accumulator;
		}, new Map() );
	}, [ pages ] );

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

	const blockList = useMemo(
		function getBlockList( parentId = parentPageID ) {
			const childPages = pagesByParentId.get( parentId );

			if ( ! childPages?.length ) {
				return [];
			}

			return childPages.reduce( ( template, page ) => {
				const hasChildren = pagesByParentId.has( page.id );
				const pageProps = {
					id: page.id,
					label:
						// translators: displayed when a page has an empty title.
						page.title?.rendered?.trim() !== ''
							? page.title?.rendered
							: __( '(no title)' ),
					title:
						// translators: displayed when a page has an empty title.
						page.title?.rendered?.trim() !== ''
							? page.title?.rendered
							: __( '(no title)' ),
					link: page.url,
					hasChildren,
				};
				let item = null;
				const children = getBlockList( page.id );
				item = createBlock(
					'core/page-list-item',
					pageProps,
					children
				);
				template.push( item );

				return template;
			}, [] );
		},
		[ pagesByParentId, parentPageID ]
	);

	const {
		hasSelectedChild,
		parentClientId,
		hasDraggedChild,
		isChildOfNavigation,
		parentOrientation,
		canConvert,
		allowedBlocksKey,
	} = useSelect(
		( select ) => {
			const {
				getBlockParentsByBlockName,
				hasSelectedInnerBlock,
				hasDraggedInnerBlock,
				getBlockRootClientId,
				getBlockListSettings,
				getBlockAttributes,
				canRemoveBlock,
				canInsertBlockType,
			} = select( blockEditorStore );
			const navigationBlockParents = getBlockParentsByBlockName(
				clientId,
				'core/navigation',
				true
			);
			return {
				isChildOfNavigation: navigationBlockParents.length > 0,
				hasSelectedChild: hasSelectedInnerBlock( clientId, true ),
				hasDraggedChild: hasDraggedInnerBlock( clientId, true ),
				parentClientId: navigationBlockParents[ 0 ],
				parentOrientation: getBlockListSettings(
					getBlockRootClientId( clientId )
				)?.orientation,
				// Converting needs a menu to switch "Auto add new pages" on
				// for, and must be allowed to replace the list with links.
				// The links count as the menu's own items, so whatever the
				// list's parent takes can go among them (as a string, to keep
				// the value stable).
				allowedBlocksKey: (
					getBlockType( 'core/navigation' )?.allowedBlocks ?? []
				)
					.filter(
						( name ) =>
							name !== 'core/page-list' &&
							canInsertBlockType(
								name,
								getBlockRootClientId( clientId )
							)
					)
					.join( ',' ),
				canConvert:
					!! getBlockAttributes( navigationBlockParents[ 0 ] )?.ref &&
					canRemoveBlock( clientId ) &&
					canInsertBlockType(
						'core/navigation-link',
						getBlockRootClientId( clientId )
					),
			};
		},
		[ clientId ]
	);

	const convertToNavigationLinks = useConvertToNavigationLinks( {
		clientId,
		pages,
		parentClientId,
		parentPageID,
	} );

	// Inside a Navigation block, the pages show as editable Navigation Links.
	// The block stays a live Page List until one of them is changed (moved,
	// removed, edited, or a block is dropped among them). Then the Page List
	// is replaced by the links as they are after that change, and the menu's
	// "Auto add new pages" setting is switched on so new pages keep arriving.
	// The query stops at MAX_PAGE_COUNT, so the total decides: converting a
	// longer list would drop the pages past the first MAX_PAGE_COUNT.
	// Converting also drops the list's own attributes, such as its styles,
	// so a list that has any keeps Detach and its warning.
	const hasOwnAttributes = Object.entries( attributes ).some(
		( [ key, value ] ) =>
			value !== undefined &&
			! [ 'parentPageID', 'lock', 'metadata' ].includes( key )
	);
	const isLinkMode =
		isChildOfNavigation &&
		canConvert &&
		! hasOwnAttributes &&
		allowConvertToLinks &&
		totalItems !== null &&
		totalItems <= MAX_PAGE_COUNT;

	// The pages query hands back a new array whenever any page record is
	// received (the links' bindings fetch each page), even with the same
	// data. Rebuilding the links then replaces them with new client IDs and
	// drops a selection made in between, so rebuild only on a real change.
	const pagesKey = useMemo(
		() =>
			pages
				? JSON.stringify(
						pages.map( ( { id, parent, link, type, title } ) => [
							id,
							parent,
							link,
							type,
							title?.rendered,
						] )
					)
				: null,
		[ pages ]
	);
	const navigationLinks = useMemo(
		() =>
			isLinkMode && pagesKey
				? buildNavigationLinks(
						JSON.parse( pagesKey ).map(
							( [ id, parent, link, type, title ] ) => ( {
								id,
								parent,
								link,
								type,
								title: { rendered: title },
							} )
						),
						parentPageID
					)
				: null,
		[ isLinkMode, pagesKey, parentPageID ]
	);

	// In link mode, editing a page already turns the list into links, with
	// "Auto add new pages" on, so there is no separate Detach.
	const canDetach = allowConvertToLinks && ! isLinkMode;

	const { selectBlock } = useDispatch( blockEditorStore );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
		__unstableDisableDropZone: ! isLinkMode,
		templateLock: isChildOfNavigation ? false : 'all',
		allowedBlocks: isLinkMode
			? allowedBlocksKey.split( ',' )
			: [ 'core/page-list-item' ],
		// The same container settings as a Navigation Submenu, so the links
		// get the same block actions (such as "Add before" and "Add after").
		defaultBlock: isLinkMode ? DEFAULT_BLOCK : undefined,
		directInsert: isLinkMode,
		// Laid out like the menu's own items, so the movers point the same way.
		orientation: isLinkMode ? parentOrientation : undefined,
		// In line with the menu's other items, so one-step moves (the block
		// movers) pass the links one at a time instead of jumping the whole
		// list, and an edge link can move out.
		[ isMoveTransparentKey ]: isLinkMode,
		// The first change to the links replaces the list with them, in the
		// same undo level, and the Navigation block switches the menu's "Auto
		// add new pages" setting on.
		[ detachesOnEditKey ]: isLinkMode,
		__experimentalCaptureToolbars: isLinkMode,
		onInput: NOOP,
		onChange: NOOP,
		value: isLinkMode ? ( navigationLinks ?? [] ) : blockList,
	} );

	useEffect( () => {
		if ( isLinkMode ) {
			return;
		}
		if ( ! hasSelectedChild && ! hasDraggedChild ) {
			return;
		}
		// The list has no overlay, so a click can land on one of its pages.
		// Outside a Navigation block the pages can't be edited, so select
		// the list itself.
		if ( ! isChildOfNavigation ) {
			selectBlock( clientId );
			return;
		}
		setIsConfirmingDetach( true );
		selectBlock( parentClientId );
	}, [
		isLinkMode,
		isChildOfNavigation,
		hasSelectedChild,
		hasDraggedChild,
		clientId,
		parentClientId,
		selectBlock,
	] );

	return (
		<>
			{ ( pagesTree.length > 0 || canDetach ) && (
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

						{ canDetach && (
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
			{ canDetach && (
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
