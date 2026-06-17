/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	BlockList,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { Button, Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import {
	type ComponentType,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';
import { navigation as navigationIcon } from '@wordpress/icons';
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

type BlockLibraryPrivateApis = {
	NavigationLinkControls?: ComponentType< NavigationLinkControlsProps >;
	NavigationLinkUI?: ComponentType;
};

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

const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

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
				const { isResolving } = select( coreStore );

				const blockClientIds = getBlockOrder( rootClientId );

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
						! areInnerBlocksControlled( rootClientId ) ||
						isLoadingPages,
				};
			},
			[ rootClientId ]
		);
	const {
		insertBlocks,
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
	}, [ editingBlockClientId ] );

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
				BLOCKS_WITH_LINK_UI_SUPPORT.includes( block.name ) &&
				block.attributes.url
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

	const addMenuItemBlocks = useCallback(
		( blocks: Block[] ) => {
			if ( ! blocks.length ) {
				return;
			}

			insertBlocks( blocks, undefined, rootClientId, false );
		},
		[ insertBlocks, rootClientId ]
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
								additionalBlockContent={ NavigationLinkUI }
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
