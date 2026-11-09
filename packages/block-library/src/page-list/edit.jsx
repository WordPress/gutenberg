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
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	Spinner as WCSpinner,
	Notice as WCNotice,
	ComboboxControl,
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState, useEffect } from '@wordpress/element';
import { useEntityRecords, store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { useConvertToNavigationLinks } from './use-convert-to-navigation-links';
import PagesPanel from './pages-panel';
import {
	getPagesByParentId,
	getPageRows,
	getMenuOrderEdits,
	getPageTitle,
	getVisiblePages,
} from './utils';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

// We only show the detach option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;
const NOOP = () => {};
const EMPTY_ARRAY = [];

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

	const { records: savedPages, hasResolved: hasResolvedPages } =
		useEntityRecords( 'postType', 'page', {
			per_page: MAX_PAGE_COUNT,
			_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
			// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
			// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
			// sort.
			orderby: 'menu_order',
			order: 'asc',
		} );

	// Reordering edits each page's `menu_order`, and those edits stay unsaved
	// until the page entities are saved, so they're merged in here.
	// The map of page IDs to edited orders is returned directly, so `useSelect`
	// compares its values and doesn't re-render while they're unchanged.
	const menuOrderEdits = useSelect(
		( select ) => {
			const { getEntityRecordEdits } = select( coreStore );
			return Object.fromEntries(
				( savedPages ?? [] ).map( ( page ) => [
					page.id,
					getEntityRecordEdits( 'postType', 'page', page.id )
						?.menu_order,
				] )
			);
		},
		[ savedPages ]
	);

	const canReorderPages = useSelect(
		( select ) =>
			!! select( coreStore ).canUser( 'update', {
				kind: 'postType',
				name: 'page',
			} ),
		[]
	);

	const pages = useMemo(
		() =>
			savedPages?.map( ( page ) =>
				menuOrderEdits[ page.id ] === undefined
					? page
					: { ...page, menu_order: menuOrderEdits[ page.id ] }
			) ?? savedPages,
		[ savedPages, menuOrderEdits ]
	);

	const allowConvertToLinks =
		'showSubmenuIcon' in context &&
		pages?.length > 0 &&
		pages?.length <= MAX_PAGE_COUNT;

	const pagesByParentId = useMemo(
		() => getPagesByParentId( pages ),
		[ pages ]
	);

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

	const blockList = useMemo(
		function getBlockList( parentId = parentPageID ) {
			const childPages = pagesByParentId.get( parentId );

			if ( ! childPages?.length ) {
				return [];
			}

			return childPages.reduce( ( template, page ) => {
				// A hidden page is left out with its child pages, matching
				// the `exclude_tree` the block renders with.
				if ( excludedIds.has( page.id ) ) {
					return template;
				}
				const children = getBlockList( page.id );
				const hasChildren = children.length > 0;
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
				const item = createBlock(
					'core/page-list-item',
					pageProps,
					children
				);
				template.push( item );

				return template;
			}, [] );
		},
		[ pagesByParentId, parentPageID, excludedIds ]
	);

	const pageRows = useMemo(
		() => getPageRows( pagesByParentId, parentPageID, excludedIds ),
		[ pagesByParentId, parentPageID, excludedIds ]
	);

	const { hasSelectedChild, parentClientId, isChildOfNavigation } = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName, hasSelectedInnerBlock } =
				select( blockEditorStore );
			const navigationBlockParents = getBlockParentsByBlockName(
				clientId,
				'core/navigation',
				true
			);
			return {
				isChildOfNavigation: navigationBlockParents.length > 0,
				hasSelectedChild: hasSelectedInnerBlock( clientId, true ),
				parentClientId: navigationBlockParents[ 0 ],
			};
		},
		[ clientId ]
	);

	// Detaching keeps what the block shows: its order, without hidden pages.
	const visiblePages = useMemo(
		() => getVisiblePages( pagesByParentId, excludedIds ),
		[ pagesByParentId, excludedIds ]
	);

	const convertToNavigationLinks = useConvertToNavigationLinks( {
		clientId,
		pages: visiblePages,
		parentClientId,
		parentPageID,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
		__unstableDisableDropZone: true,
		// Pages are reordered and hidden from the Pages panel, so they can't
		// be moved out of the Page List, into the Navigation around it.
		templateLock: 'all',
		onInput: NOOP,
		onChange: NOOP,
		value: blockList,
	} );

	const { selectBlock } = useDispatch( blockEditorStore );
	const { editEntityRecord } = useDispatch( coreStore );

	// Selecting a page selects the Page List, whose Pages panel is where pages
	// are reordered and hidden.
	useEffect( () => {
		if ( hasSelectedChild ) {
			selectBlock( clientId );
		}
	}, [ hasSelectedChild, clientId, selectBlock ] );

	const togglePage = ( pageId ) => {
		const isExcluded = excludedIds.has( pageId );
		setAttributes( {
			excludedPageIDs: isExcluded
				? excludedPageIDs.filter( ( id ) => id !== pageId )
				: [ ...excludedPageIDs, pageId ],
		} );
	};

	const movePage = ( row, toIndex ) => {
		const siblings = pagesByParentId.get( row.page.parent ) ?? [];
		const edits = getMenuOrderEdits( siblings, row.page.id, toIndex );
		if ( ! edits.length ) {
			return;
		}
		// The first edit opens an undo level and the rest are staged into it,
		// so one undo puts every page back.
		edits.forEach( ( { id, menu_order: menuOrder }, index ) =>
			editEntityRecord(
				'postType',
				'page',
				id,
				{ menu_order: menuOrder },
				{ isCached: index > 0 }
			)
		);
		speak(
			sprintf(
				/* translators: 1: Page title. 2: New position. 3: Number of pages at that level. */
				__( '%1$s moved to position %2$d of %3$d.' ),
				getPageTitle( row.page ),
				toIndex + 1,
				siblings.length
			)
		);
	};

	return (
		<>
			{ isChildOfNavigation &&
				hasResolvedPages &&
				pageRows.length > 0 && (
					<InspectorControls>
						<PagesPanel
							rows={ pageRows }
							excludedIds={ excludedPageIDs }
							canReorder={ canReorderPages }
							onToggle={ togglePage }
							onMove={ movePage }
						/>
					</InspectorControls>
				) }
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
