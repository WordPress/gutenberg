import clsx from 'clsx';
import type { DragEvent } from 'react';
import {
	Draggable,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import {
	dragHandle,
	moreVertical,
	chevronUp,
	chevronDown,
	page as pageIcon,
	plus,
	Icon,
} from '@wordpress/icons';
import { Switch, VisuallyHidden } from '@wordpress/ui';
import { getPageTitle } from './utils';
import type { PageRow } from './utils';

/**
 * The drag data type of a page dragged from the list, so a drop target outside
 * it, such as the Navigation block's list view, can recognise one.
 */
export const PAGE_DRAG_TYPE = 'wp-page-list-page';

interface DragState {
	pageId: number;
	parentId: number;
}

interface DropTarget {
	pageId: number;
	isAfter: boolean;
}

interface PagesListProps {
	/** Rows from `getPageRows`. */
	rows: PageRow[];
	/** IDs of hidden pages. */
	excludedIds: number[];
	/** Whether the user can edit page order. */
	canReorder: boolean;
	/** Called with a page ID to show or hide that page. */
	onToggle: ( pageId: number ) => void;
	/** Called with a row and the position to move its page to. */
	onMove: ( row: PageRow, toIndex: number ) => void;
	/** Called with a row to add a link after its page, if links can be added. */
	onAddLinkAfter?: ( ( row: PageRow ) => void ) | null;
	/**
	 * Whether what's being dragged, from outside the list, can be dropped next
	 * to a page: another item of the menu.
	 */
	canDropItems?: () => boolean;
	/** Called when that's dropped, with the row and which side of it. */
	onDropItems?: ( row: PageRow, isAfter: boolean ) => void;
}

interface PageRowItemProps {
	row: PageRow;
	isExcluded: boolean;
	canReorder: boolean;
	isDragging: boolean;
	dropTarget: DropTarget | null;
	reorderHintId?: string;
	handleRef: ( node: HTMLButtonElement | null ) => void;
	onToggle: ( pageId: number ) => void;
	onMove: ( row: PageRow, toIndex: number ) => void;
	onKeyboardMove: ( row: PageRow, toIndex: number ) => void;
	onAddLinkAfter?: ( ( row: PageRow ) => void ) | null;
	onDragStart: () => void;
	onDragEnd: () => void;
	onDragOver: ( event: DragEvent< HTMLLIElement > ) => void;
	onDrop: ( event: DragEvent< HTMLLIElement > ) => void;
}

/**
 * Follows the cursor while a page is dragged, so it's clear which page is
 * moving. It looks like the chip shown when dragging blocks.
 *
 * @param props       Component props.
 * @param props.title The page's title.
 */
export function PageDragChip( { title }: { title: string } ) {
	return (
		<div className="wp-block-page-list__pages-panel-drag-chip">
			<Icon icon={ pageIcon } size={ 20 } />
			<span className="wp-block-page-list__pages-panel-drag-chip-title">
				{ title }
			</span>
			<Icon icon={ dragHandle } size={ 18 } />
		</div>
	);
}

function PageRowItem( {
	row,
	isExcluded,
	canReorder,
	isDragging,
	dropTarget,
	reorderHintId,
	handleRef,
	onToggle,
	onMove,
	onKeyboardMove,
	onAddLinkAfter,
	onDragStart,
	onDragEnd,
	onDragOver,
	onDrop,
}: PageRowItemProps ) {
	const { page, depth, index, siblingIds, isHiddenByAncestor } = row;
	const title = getPageTitle( page );
	const isShown = ! isExcluded && ! isHiddenByAncestor;
	const isFirst = index === 0;
	const isLast = index === siblingIds.length - 1;
	const hasOptions = canReorder || !! onAddLinkAfter;

	return (
		<li
			className={ clsx( 'wp-block-page-list__pages-panel-row', {
				'is-hidden': ! isShown,
				'is-dragging': isDragging,
				'is-drop-before': dropTarget && ! dropTarget.isAfter,
				'is-drop-after': dropTarget?.isAfter,
			} ) }
			onDragOver={ onDragOver }
			onDrop={ onDrop }
		>
			{ canReorder && (
				<Draggable
					// Only used without a drag component, to clone the element.
					elementId={ `wp-block-page-list__pages-panel-page-${ page.id }` }
					transferData={ { type: 'page', id: page.id } }
					__experimentalTransferDataType={ PAGE_DRAG_TYPE }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
					__experimentalDragComponent={
						<PageDragChip title={ title } />
					}
				>
					{ ( { onDraggableStart, onDraggableEnd } ) => (
						<button
							ref={ handleRef }
							type="button"
							className="wp-block-page-list__pages-panel-handle"
							draggable
							onDragStart={ onDraggableStart }
							onDragEnd={ onDraggableEnd }
							onKeyDown={ ( event ) => {
								if ( event.key === 'ArrowUp' && ! isFirst ) {
									event.preventDefault();
									onKeyboardMove( row, index - 1 );
								} else if (
									event.key === 'ArrowDown' &&
									! isLast
								) {
									event.preventDefault();
									onKeyboardMove( row, index + 1 );
								}
							} }
							aria-label={ sprintf(
								/* translators: %s: Page title. */
								__( 'Reorder %s' ),
								title
							) }
							aria-describedby={ reorderHintId }
						>
							{ dragHandle }
						</button>
					) }
				</Draggable>
			) }
			<span
				className="wp-block-page-list__pages-panel-title"
				style={ { paddingInlineStart: depth * 16 } }
			>
				<Truncate>{ title }</Truncate>
			</span>
			<Switch
				className="wp-block-page-list__pages-panel-toggle"
				checked={ isShown }
				disabled={ isHiddenByAncestor }
				onCheckedChange={ () => onToggle( page.id ) }
				aria-label={ sprintf(
					/* translators: %s: Page title. */
					__( 'Show %s in the menu' ),
					title
				) }
			/>
			{ hasOptions && (
				<DropdownMenu
					icon={ moreVertical }
					label={ sprintf(
						/* translators: %s: Page title. */
						__( 'Options for %s' ),
						title
					) }
					toggleProps={ { size: 'small' } }
					className="wp-block-page-list__pages-panel-options"
				>
					{ ( { onClose } ) => (
						<>
							{ canReorder && (
								<MenuGroup>
									<MenuItem
										icon={ chevronUp }
										disabled={ isFirst }
										onClick={ () => {
											onMove( row, index - 1 );
											onClose();
										} }
									>
										{ __( 'Move up' ) }
									</MenuItem>
									<MenuItem
										icon={ chevronDown }
										disabled={ isLast }
										onClick={ () => {
											onMove( row, index + 1 );
											onClose();
										} }
									>
										{ __( 'Move down' ) }
									</MenuItem>
								</MenuGroup>
							) }
							{ onAddLinkAfter && (
								<MenuGroup>
									<MenuItem
										icon={ plus }
										disabled={ ! isShown }
										info={ __(
											"Turns this menu's pages into links, which no longer update as pages change."
										) }
										onClick={ () => {
											onClose();
											onAddLinkAfter( row );
										} }
									>
										{ __( 'Add link after' ) }
									</MenuItem>
								</MenuGroup>
							) }
						</>
					) }
				</DropdownMenu>
			) }
		</li>
	);
}

/**
 * Lists every page the Page List shows, with a switch to show or hide each
 * one and, for people who can edit pages, controls to reorder them among
 * their siblings. A page moves with its child pages.
 */
export default function PagesList( {
	rows,
	excludedIds,
	canReorder,
	onToggle,
	onMove,
	onAddLinkAfter,
	canDropItems,
	onDropItems,
}: PagesListProps ) {
	const [ dragState, setDragState ] = useState< DragState | null >( null );
	const [ dropTarget, setDropTarget ] = useState< DropTarget | null >( null );
	const handleRefs = useRef( new Map< number, HTMLButtonElement >() );
	const reorderHintId = useInstanceId(
		PagesList,
		'wp-block-page-list__pages-panel-hint'
	) as string;
	const hasOptions = canReorder || !! onAddLinkAfter;

	// A moved row's handle can lose focus while the list re-renders in the
	// new order, so focus goes back to it once the list has updated.
	const moveWithKeyboard = ( row: PageRow, toIndex: number ) => {
		const pageId = row.page.id;
		const view =
			handleRefs.current.get( pageId )?.ownerDocument.defaultView;
		onMove( row, toIndex );
		view?.requestAnimationFrame( () => {
			const handle = handleRefs.current.get( pageId );
			if ( handle && handle.ownerDocument.activeElement !== handle ) {
				handle.focus();
			}
		} );
	};

	const clearDrag = () => {
		setDragState( null );
		setDropTarget( null );
	};

	// A page moves only among its siblings, taking its child pages with it.
	const isSiblingOfDragged = ( row: PageRow ) =>
		!! dragState && row.page.parent === dragState.parentId;

	// Another item of the menu can go next to any page that's in the menu.
	const canDropItemsOn = ( row: PageRow ) =>
		! dragState &&
		!! canDropItems?.() &&
		! row.isHiddenByAncestor &&
		! excludedIds.includes( row.page.id );

	const handleDrop = ( row: PageRow ) => {
		if ( ! dragState && dropTarget && canDropItemsOn( row ) ) {
			const { isAfter } = dropTarget;
			clearDrag();
			onDropItems?.( row, isAfter );
			return;
		}
		if ( ! dragState || ! dropTarget || ! isSiblingOfDragged( row ) ) {
			clearDrag();
			return;
		}
		const { siblingIds } = row;
		const fromIndex = siblingIds.indexOf( dragState.pageId );
		let toIndex =
			siblingIds.indexOf( dropTarget.pageId ) +
			( dropTarget.isAfter ? 1 : 0 );
		if ( toIndex > fromIndex ) {
			toIndex -= 1;
		}
		const draggedRow = rows.find(
			( { page } ) => page.id === dragState.pageId
		);
		clearDrag();
		if ( draggedRow && toIndex !== fromIndex ) {
			onMove( draggedRow, toIndex );
		}
	};

	return (
		<div className="wp-block-page-list__pages-panel">
			<p className="wp-block-page-list__pages-panel-help">
				{ canReorder
					? __(
							'Pages that are switched on show in this menu, in the order of this list. Changing the order changes the order of your pages everywhere on your site.'
						)
					: __( 'Pages that are switched on show in this menu.' ) }
			</p>
			{ canReorder && (
				<VisuallyHidden id={ reorderHintId }>
					{ __(
						'Use the up and down arrow keys to move the page among the pages at its level, or drag it.'
					) }
				</VisuallyHidden>
			) }
			<div
				className={ clsx( 'wp-block-page-list__pages-panel-head', {
					'has-handle': canReorder,
					'has-options': hasOptions,
				} ) }
				aria-hidden="true"
			>
				<span>{ __( 'Page' ) }</span>
				<span>{ __( 'In menu' ) }</span>
			</div>
			<ul
				className="wp-block-page-list__pages-panel-list"
				aria-label={ __( 'Pages' ) }
				onDragLeave={ ( event ) => {
					if (
						! event.currentTarget.contains(
							event.relatedTarget as Node | null
						)
					) {
						setDropTarget( null );
					}
				} }
			>
				{ rows.map( ( row ) => (
					<PageRowItem
						key={ row.page.id }
						row={ row }
						isExcluded={ excludedIds.includes( row.page.id ) }
						canReorder={ canReorder }
						isDragging={ dragState?.pageId === row.page.id }
						dropTarget={
							dropTarget?.pageId === row.page.id
								? dropTarget
								: null
						}
						reorderHintId={ canReorder ? reorderHintId : undefined }
						handleRef={ ( node ) => {
							if ( node ) {
								handleRefs.current.set( row.page.id, node );
							} else {
								handleRefs.current.delete( row.page.id );
							}
						} }
						onToggle={ onToggle }
						onMove={ onMove }
						onKeyboardMove={ moveWithKeyboard }
						onAddLinkAfter={ onAddLinkAfter }
						onDragStart={ () =>
							setDragState( {
								pageId: row.page.id,
								parentId: row.page.parent,
							} )
						}
						onDragEnd={ clearDrag }
						onDragOver={ ( event ) => {
							if (
								! isSiblingOfDragged( row ) &&
								! canDropItemsOn( row )
							) {
								return;
							}
							event.preventDefault();
							event.dataTransfer.dropEffect = 'move';
							const { top, height } =
								event.currentTarget.getBoundingClientRect();
							const isAfter = event.clientY > top + height / 2;
							if (
								dropTarget?.pageId !== row.page.id ||
								dropTarget?.isAfter !== isAfter
							) {
								setDropTarget( {
									pageId: row.page.id,
									isAfter,
								} );
							}
						} }
						onDrop={ ( event ) => {
							event.preventDefault();
							handleDrop( row );
						} }
					/>
				) ) }
			</ul>
		</div>
	);
}
