/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Popover,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import {
	type ComponentType,
	type Ref,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import {
	addSubmenu as addSubmenuIcon,
	link as linkIcon,
	navigation as navigationIcon,
	page,
	postCategories,
	plus,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { EmptyState } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import LeafMoreMenu from './leaf-more-menu';
import AddMenuItemsModal from '../add-menu-items-modal';

type Block = {
	clientId: string;
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks?: Block[];
};

type NavigationMenuRecord = {
	id: number;
	title?: {
		raw?: string;
		rendered?: string;
	};
	content?: {
		raw?: string;
		rendered?: string;
	};
};

const { PrivateListView } = unlock( blockEditorPrivateApis );

type NavigationLinkControlsProps = {
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	clientId: string;
	isContentOnly?: boolean;
};

type NavigationLinkUIProps = {
	block: Block;
	insertedBlock?: Block | null;
	setInsertedBlock: ( block: Block | null ) => void;
	showBlockInserter?: boolean;
};

type NavigationTreeAppenderProps = {
	clientId: string;
	descriptionId: string;
	ref?: Ref< HTMLButtonElement >;
	setInsertedBlock: ( block: Block | null ) => void;
	onAddExistingPage: (
		parentClientId: string,
		setInsertedBlock: ( block: Block | null ) => void
	) => void;
	onAddCustomLink: (
		parentClientId: string,
		setInsertedBlock: ( block: Block | null ) => void
	) => void;
	onAddSubmenu: (
		parentClientId: string,
		setInsertedBlock: ( block: Block | null ) => void
	) => void;
	onAddMenuItems: () => void;
} & Record< string, unknown >;

type BlockLibraryPrivateApis = {
	NavigationLinkControls?: ComponentType< NavigationLinkControlsProps >;
	NavigationLinkUI?: ComponentType< NavigationLinkUIProps >;
};

function deferUntilDropdownCloses( callback: () => void ) {
	window.requestAnimationFrame( callback );
}

function getBlockLibraryPrivateApis(): BlockLibraryPrivateApis {
	const blockLibrary = (
		window as Window & {
			wp?: {
				blockLibrary?: {
					privateApis?: Parameters< typeof unlock >[ 0 ];
				};
			};
		}
	 ).wp?.blockLibrary;

	if ( ! blockLibrary?.privateApis ) {
		return {};
	}

	return unlock< BlockLibraryPrivateApis >( blockLibrary.privateApis );
}

function NavigationTreeAppender( {
	clientId,
	descriptionId,
	ref: buttonRef,
	setInsertedBlock,
	onAddExistingPage,
	onAddCustomLink,
	onAddSubmenu,
	onAddMenuItems,
	...treeGridCellProps
}: NavigationTreeAppenderProps ) {
	const toggleClassName = [
		typeof treeGridCellProps.className === 'string'
			? treeGridCellProps.className
			: '',
		'block-editor-inserter__toggle',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<DropdownMenu
			icon={ plus }
			label={ __( 'Add menu item' ) }
			popoverProps={ { placement: 'bottom-start' } }
			toggleProps={ {
				...treeGridCellProps,
				ref: buttonRef,
				className: toggleClassName,
				__next40pxDefaultSize: true,
				'aria-describedby': descriptionId,
			} }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							icon={ page }
							onClick={ () => {
								onClose();
								deferUntilDropdownCloses( () =>
									onAddExistingPage(
										clientId,
										setInsertedBlock
									)
								);
							} }
						>
							{ __( 'Add existing page' ) }
						</MenuItem>
						<MenuItem
							icon={ linkIcon }
							onClick={ () => {
								onClose();
								deferUntilDropdownCloses( () =>
									onAddCustomLink(
										clientId,
										setInsertedBlock
									)
								);
							} }
						>
							{ __( 'Custom link' ) }
						</MenuItem>
						<MenuItem
							icon={ addSubmenuIcon }
							onClick={ () => {
								onClose();
								deferUntilDropdownCloses( () =>
									onAddSubmenu( clientId, setInsertedBlock )
								);
							} }
						>
							{ __( 'Submenu' ) }
						</MenuItem>
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							icon={ postCategories }
							onClick={ () => {
								onAddMenuItems();
								onClose();
							} }
						>
							{ __( 'More…' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}

// Needs to be kept in sync with the query used at packages/block-library/src/page-list/edit.js.
const MAX_PAGE_COUNT = 100;
const PAGES_QUERY = [
	'postType',
	'page',
	{
		per_page: MAX_PAGE_COUNT,
		_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
		// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
		// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
		// sort.
		orderby: 'menu_order',
		order: 'asc',
	},
];

export default function NavigationMenuContent( {
	isAddingItems,
	navigationMenu,
	onAddMenuItems,
	onCloseAddMenuItems,
	rootClientId,
}: {
	isAddingItems: boolean;
	navigationMenu: NavigationMenuRecord;
	onAddMenuItems: () => void;
	onCloseAddMenuItems: () => void;
	rootClientId: string;
} ) {
	const navigationMenuId = navigationMenu.id;
	const { hasMenuItems, listViewRootClientId, navigationBlocks, isLoading } =
		useSelect(
			( select ) => {
				const {
					areInnerBlocksControlled,
					getBlocks,
					getBlockName,
					getBlockCount,
					getBlockOrder,
				} = select( blockEditorStore );
				const {
					getEditedEntityRecord,
					hasFinishedResolution,
					isResolving,
				} = select( coreStore );

				const blockClientIds = getBlockOrder( rootClientId );
				const blockCount = getBlockCount( rootClientId );
				const navigationEntityArgs = [
					'postType',
					'wp_navigation',
					navigationMenuId,
				];
				const editedNavigationMenu = getEditedEntityRecord(
					...navigationEntityArgs
				);
				const hasResolvedEditedNavigationMenu = hasFinishedResolution(
					'getEditedEntityRecord',
					navigationEntityArgs
				);
				const editedContent = editedNavigationMenu?.content;
				const editedBlocks = editedNavigationMenu?.blocks;
				const editedContentString =
					typeof editedContent === 'string'
						? editedContent
						: editedContent?.raw;
				const editedMenuHasSavedBlocks = Array.isArray( editedBlocks )
					? editedBlocks.length > 0
					: typeof editedContentString === 'string' &&
					  editedContentString.includes( '<!-- wp:' );

				const hasOnlyPageListBlock =
					blockClientIds.length === 1 &&
					getBlockName( blockClientIds[ 0 ] ) === 'core/page-list';
				const pageListHasBlocks =
					hasOnlyPageListBlock &&
					getBlockCount( blockClientIds[ 0 ] ) > 0;

				const isLoadingPages = isResolving(
					'getEntityRecords',
					PAGES_QUERY
				);
				const _listViewRootClientId = pageListHasBlocks
					? blockClientIds[ 0 ]
					: rootClientId;

				return {
					hasMenuItems: getBlockCount( _listViewRootClientId ) > 0,
					listViewRootClientId: _listViewRootClientId,
					navigationBlocks: getBlocks( rootClientId ),
					// This is a small hack to wait for the navigation block
					// to actually load its inner blocks.
					isLoading:
						! hasResolvedEditedNavigationMenu ||
						! areInnerBlocksControlled( rootClientId ) ||
						isLoadingPages ||
						( editedMenuHasSavedBlocks && blockCount === 0 ),
				};
			},
			[ navigationMenuId, rootClientId ]
		);
	const {
		insertBlocks,
		insertBlock,
		replaceBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const [ editingBlockClientId, setEditingBlockClientId ] = useState<
		string | null
	>( null );
	const [ anchorElement, setAnchorElement ] = useState< Element | null >(
		null
	);
	const listViewRef = useRef< HTMLDivElement >( null );

	const editingBlockAttributes = useSelect(
		( select ) => {
			if ( ! editingBlockClientId ) {
				return null;
			}

			return select( blockEditorStore ).getBlockAttributes(
				editingBlockClientId
			);
		},
		[ editingBlockClientId ]
	);

	useLayoutEffect( () => {
		if ( ! editingBlockClientId || ! listViewRef.current ) {
			setAnchorElement( null );
			return;
		}

		const element = listViewRef.current.querySelector(
			`[data-block="${ editingBlockClientId }"]`
		);
		setAnchorElement( element ?? null );
	}, [ editingBlockClientId, navigationBlocks ] );

	const offCanvasOnselect = useCallback(
		( block: Block ) => {
			if (
				block.name === 'core/navigation-link' &&
				! block.attributes.url
			) {
				__unstableMarkNextChangeAsNotPersistent();
				replaceBlock(
					block.clientId,
					createBlock( 'core/navigation-link', block.attributes )
				);
			}
		},
		[ __unstableMarkNextChangeAsNotPersistent, replaceBlock ]
	);

	const handleSelect = useCallback(
		( block: Block ) => {
			if (
				block.name === 'core/navigation-submenu' ||
				( block.name === 'core/navigation-link' &&
					block.attributes.url )
			) {
				setEditingBlockClientId( block.clientId );
				return;
			}

			setEditingBlockClientId( null );
			offCanvasOnselect( block );
		},
		[ offCanvasOnselect ]
	);
	const { NavigationLinkControls, NavigationLinkUI } =
		getBlockLibraryPrivateApis();
	const InsertedNavigationLinkUI = useCallback(
		( props: NavigationLinkUIProps ) =>
			NavigationLinkUI ? (
				<NavigationLinkUI { ...props } showBlockInserter={ false } />
			) : null,
		[ NavigationLinkUI ]
	);

	const addMenuItemBlocks = useCallback(
		( blocks: Block[] ) => {
			if ( ! blocks.length ) {
				return;
			}

			insertBlocks( blocks, undefined, rootClientId, false );
		},
		[ insertBlocks, rootClientId ]
	);

	const addExistingPage = useCallback(
		(
			parentClientId: string,
			setInsertedBlock: ( block: Block | null ) => void
		) => {
			const block = createBlock( 'core/navigation-link', {
				kind: 'post-type',
				type: 'page',
			} );

			insertBlock( block, undefined, parentClientId, false );
			setEditingBlockClientId( null );
			setInsertedBlock( block );
		},
		[ insertBlock ]
	);

	const addCustomLink = useCallback(
		(
			parentClientId: string,
			setInsertedBlock: ( block: Block | null ) => void
		) => {
			const block = createBlock( 'core/navigation-link' );

			insertBlock( block, undefined, parentClientId, false );
			setEditingBlockClientId( null );
			setInsertedBlock( block );
		},
		[ insertBlock ]
	);

	const addSubmenu = useCallback(
		(
			parentClientId: string,
			setInsertedBlock: ( block: Block | null ) => void
		) => {
			const block = createBlock( 'core/navigation-submenu' );

			insertBlock( block, undefined, parentClientId, false );
			setEditingBlockClientId( null );
			setInsertedBlock( block );
		},
		[ insertBlock ]
	);

	const renderNavigationTreeAppender = useCallback(
		( props: NavigationTreeAppenderProps ) => (
			<NavigationTreeAppender
				{ ...props }
				onAddExistingPage={ addExistingPage }
				onAddCustomLink={ addCustomLink }
				onAddSubmenu={ addSubmenu }
				onAddMenuItems={ onAddMenuItems }
			/>
		),
		[ addCustomLink, addExistingPage, addSubmenu, onAddMenuItems ]
	);

	// The hidden block is needed because it makes block edit side effects trigger.
	// For example a navigation page list load its items has an effect on edit to load its items.
	return (
		<>
			{ ! isLoading && (
				<>
					{ hasMenuItems ? (
						<div ref={ listViewRef }>
							<PrivateListView
								rootClientId={ listViewRootClientId }
								onSelect={ handleSelect }
								blockSettingsMenu={ LeafMoreMenu }
								showAppender
								renderAppender={ renderNavigationTreeAppender }
								additionalBlockContent={
									InsertedNavigationLinkUI
								}
								isExpanded
							/>
						</div>
					) : (
						<EmptyState.Root>
							<EmptyState.Icon icon={ navigationIcon } />
							<EmptyState.Title>
								{ __( 'No menu items yet' ) }
							</EmptyState.Title>
							<EmptyState.Description>
								{ __(
									'Add pages, links, or other content to start building this navigation menu.'
								) }
							</EmptyState.Description>
							<EmptyState.Actions>
								<Button
									variant="primary"
									onClick={ onAddMenuItems }
									__next40pxDefaultSize
								>
									{ __( 'Add menu items' ) }
								</Button>
							</EmptyState.Actions>
						</EmptyState.Root>
					) }
				</>
			) }
			{ editingBlockClientId &&
				editingBlockAttributes &&
				anchorElement &&
				NavigationLinkControls && (
					<Popover
						anchor={ anchorElement }
						placement="right-start"
						onClose={ () => setEditingBlockClientId( null ) }
						className="navigation-edit-editor__link-controls"
					>
						<div style={ { width: '280px' } }>
							<NavigationLinkControls
								attributes={ editingBlockAttributes }
								setAttributes={ (
									newAttributes: Record< string, unknown >
								) =>
									updateBlockAttributes(
										editingBlockClientId,
										newAttributes
									)
								}
								clientId={ editingBlockClientId }
								isContentOnly
							/>
						</div>
					</Popover>
				) }
			<div className="navigation-edit-editor__hidden-blocks">
				<BlockList />
			</div>
			{ isAddingItems && (
				<AddMenuItemsModal
					navigationBlocks={ navigationBlocks }
					navigationMenu={ navigationMenu }
					onAddBlocks={ addMenuItemBlocks }
					onClose={ onCloseAddMenuItems }
				/>
			) }
		</>
	);
}
