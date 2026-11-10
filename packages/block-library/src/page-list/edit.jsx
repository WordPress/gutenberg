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
	useBlockEditingMode,
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
import { useSelect, useDispatch } from '@wordpress/data';
import { useConvertToNavigationLinks } from './use-convert-to-navigation-links';
import { usePageListPages, MAX_PAGE_COUNT } from './use-page-list-pages';
import { getVisiblePages } from './utils';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

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

	const { pages, pagesByParentId, hasResolvedPages } = usePageListPages();

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

	// In a Navigation block, the Navigation block's sidebar lists the pages
	// in place of the Page List, so the Page List itself can't be selected and
	// isn't in the list view. Adding a link after one of its pages detaches it.
	useBlockEditingMode( isChildOfNavigation ? 'disabled' : undefined );

	// Selecting a page selects the Page List, whose Pages panel is where pages
	// are reordered and hidden.
	useEffect( () => {
		if ( hasSelectedChild ) {
			selectBlock( clientId );
		}
	}, [ hasSelectedChild, clientId, selectBlock ] );

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
