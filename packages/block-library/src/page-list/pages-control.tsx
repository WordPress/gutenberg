import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { plus } from '@wordpress/icons';
import clsx from 'clsx';
import { usePageListPages } from './use-page-list-pages';
import PagesList from './pages-list';
import styles from './pages-list.module.scss';
import { getPageRows, getMoveEdits, getPageTitle } from './utils';
import type { PageRow } from './utils';

const EMPTY_ARRAY: number[] = [];

interface PageListPagesControlProps {
	/** Client ID of the Page List block. */
	clientId: string;
	/**
	 * Whether to show an Add link button below the pages, for when nothing
	 * else in the Navigation block offers one.
	 */
	showAddLink?: boolean;
	/**
	 * Called with a page ID to add a link after that page, from
	 * `useAddLinkAfterPage`.
	 */
	onAddLinkAfter?: ( pageId: number ) => void;
	/**
	 * Called with the client ID of a link the Add link button added, to open
	 * its search.
	 */
	onLinkAdded?: ( clientId: string ) => void;
	/**
	 * Called when other items of the Navigation block are dropped next to a
	 * page, from `useDropIntoOrOutOfPageList`.
	 */
	onDropItems?: (
		blockClientIds: string[],
		pageId: number,
		isAfter: boolean
	) => void;
}

/**
 * The pages a Page List inside a Navigation block shows, to switch on or
 * off and to reorder, with ways to add a link after them. Shown in the Page
 * List's sidebar and in the Navigation block's.
 *
 * @param props                Component props.
 * @param props.clientId       Client ID of the Page List block.
 * @param props.showAddLink    Whether to show an Add link button below the pages.
 * @param props.onAddLinkAfter Called with a page ID to add a link after it.
 * @param props.onDropItems    Called when other items are dropped next to a page.
 * @param props.onLinkAdded    Called with the client ID of a link Add link added.
 */
export default function PageListPagesControl( {
	clientId,
	showAddLink = false,
	onAddLinkAfter,
	onDropItems,
	onLinkAdded,
}: PageListPagesControlProps ) {
	const registry = useRegistry();
	const { pagesByParentId, hasResolvedPages, canReorderPages } =
		usePageListPages();

	const { parentPageID, excludedPageIDs, navigationClientId, index } =
		useSelect(
			( select ) => {
				const {
					getBlockAttributes,
					getBlockParentsByBlockName,
					getBlockIndex,
				} = select( blockEditorStore );
				const attributes = getBlockAttributes( clientId ) ?? {};
				return {
					parentPageID: ( attributes.parentPageID ?? 0 ) as number,
					excludedPageIDs: ( Array.isArray(
						attributes.excludedPageIDs
					)
						? attributes.excludedPageIDs
						: EMPTY_ARRAY ) as number[],
					navigationClientId: getBlockParentsByBlockName(
						clientId,
						'core/navigation',
						true
					)[ 0 ] as string | undefined,
					index: getBlockIndex( clientId ),
				};
			},
			[ clientId ]
		);

	const excludedIds = useMemo(
		() => new Set( excludedPageIDs ),
		[ excludedPageIDs ]
	);

	const rows = useMemo(
		() => getPageRows( pagesByParentId, parentPageID, excludedIds ),
		[ pagesByParentId, parentPageID, excludedIds ]
	);

	const { updateBlockAttributes, insertBlock } =
		useDispatch( blockEditorStore );
	const { editEntityRecord } = useDispatch( coreStore );

	if ( ! hasResolvedPages || rows.length === 0 ) {
		return null;
	}

	const togglePage = ( pageId: number ) => {
		updateBlockAttributes( clientId, {
			excludedPageIDs: excludedIds.has( pageId )
				? excludedPageIDs.filter( ( id ) => id !== pageId )
				: [ ...excludedPageIDs, pageId ],
		} );
	};

	// Moves a page to a position under a parent, which may be another level.
	const movePage = ( row: PageRow, parentId: number, toIndex: number ) => {
		const edits = getMoveEdits(
			pagesByParentId,
			row.page,
			parentId,
			toIndex
		);
		if ( ! edits.length ) {
			return;
		}
		// The first edit opens an undo level and the rest are staged into it,
		// so one undo puts every page back.
		edits.forEach( ( { id, menu_order: menuOrder, parent }, editIndex ) =>
			editEntityRecord(
				'postType',
				'page',
				id,
				parent === undefined
					? { menu_order: menuOrder }
					: { menu_order: menuOrder, parent },
				{ isCached: editIndex > 0 }
			)
		);
		const title = getPageTitle( row.page );
		if ( parentId === row.page.parent ) {
			speak(
				sprintf(
					/* translators: 1: Page title. 2: New position. 3: Number of pages at that level. */
					__( '%1$s moved to position %2$d of %3$d.' ),
					title,
					toIndex + 1,
					pagesByParentId.get( parentId )?.length ?? 0
				)
			);
			return;
		}
		const newParent = rows.find( ( { page } ) => page.id === parentId );
		speak(
			newParent
				? sprintf(
						/* translators: 1: Page title. 2: Title of the page it was moved under. */
						__( '%1$s moved under %2$s.' ),
						title,
						getPageTitle( newParent.page )
					)
				: sprintf(
						/* translators: %s: Page title. */
						__( '%s moved to the top level.' ),
						title
					)
		);
	};

	const addLinkAfterPages = () => {
		if ( ! navigationClientId ) {
			return;
		}
		const link = createBlock( 'core/navigation-link' );
		// Without a caller to open its search, selecting the link opens the
		// one in the canvas.
		insertBlock( link, index + 1, navigationClientId, ! onLinkAdded );
		onLinkAdded?.( link.clientId );
	};

	// Items are being dragged from elsewhere in this Navigation block, such as
	// its list view. Read at drag time, so dragging doesn't re-render this.
	const getDraggedItems = (): string[] => {
		if ( ! navigationClientId ) {
			return [];
		}
		const { getDraggedBlockClientIds, getBlockParents } =
			registry.select( blockEditorStore );
		const dragged: string[] = getDraggedBlockClientIds();
		return dragged.length &&
			dragged.every( ( id ) =>
				getBlockParents( id ).includes( navigationClientId )
			)
			? dragged
			: [];
	};

	return (
		<>
			<PagesList
				rows={ rows }
				excludedIds={ excludedPageIDs }
				canReorder={ canReorderPages }
				onToggle={ togglePage }
				onMove={ movePage }
				onAddLinkAfter={
					navigationClientId && onAddLinkAfter
						? ( row ) => onAddLinkAfter( row.page.id )
						: null
				}
				canDropItems={ () =>
					!! onDropItems && getDraggedItems().length > 0
				}
				onDropItems={ ( row, isAfter ) => {
					const dragged = getDraggedItems();
					if ( onDropItems && dragged.length ) {
						onDropItems( dragged, row.page.id, isAfter );
					}
				} }
			/>
			{ showAddLink && navigationClientId && (
				<Button
					__next40pxDefaultSize
					className={ clsx(
						'wp-block-page-list__pages-panel-add-link',
						styles[ 'add-link' ]
					) }
					variant="secondary"
					icon={ plus }
					onClick={ addLinkAfterPages }
				>
					{ __( 'Add link' ) }
				</Button>
			) }
		</>
	);
}
