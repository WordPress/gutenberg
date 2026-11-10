import { createBlock } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { plus } from '@wordpress/icons';
import { usePageListPages } from './use-page-list-pages';
import PagesList from './pages-list';
import { getPageRows, getMenuOrderEdits, getPageTitle } from './utils';
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
 */
export default function PageListPagesControl( {
	clientId,
	showAddLink = false,
	onAddLinkAfter,
}: PageListPagesControlProps ) {
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

	const movePage = ( row: PageRow, toIndex: number ) => {
		const siblings = pagesByParentId.get( row.page.parent ) ?? [];
		const edits = getMenuOrderEdits( siblings, row.page.id, toIndex );
		if ( ! edits.length ) {
			return;
		}
		// The first edit opens an undo level and the rest are staged into it,
		// so one undo puts every page back.
		edits.forEach( ( { id, menu_order: menuOrder }, editIndex ) =>
			editEntityRecord(
				'postType',
				'page',
				id,
				{ menu_order: menuOrder },
				{ isCached: editIndex > 0 }
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

	const addLinkAfterPages = () => {
		if ( navigationClientId ) {
			insertBlock(
				createBlock( 'core/navigation-link' ),
				index + 1,
				navigationClientId
			);
		}
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
			/>
			{ showAddLink && navigationClientId && (
				<Button
					__next40pxDefaultSize
					className="wp-block-page-list__pages-panel-add-link"
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
