import type { CSSProperties, DragEvent } from 'react';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Icon, moreVertical } from '@wordpress/icons';
import ListViewBlockSelectButton from './block-select-button';
import BlockDraggableChip from '../block-draggable/draggable-chip';
import useBlockDisplayInformation from '../use-block-display-information';

export interface DragChipSnapshot {
	rect: DOMRect;
	listViewRect?: DOMRect;
	clientX: number;
	clientY: number;
	level: string | null;
	isExpanded: string | null;
	color: string;
	background?: string;
	padding: string;
	borderRadius: string;
	contentsWidth?: number;
	menu?: {
		left: number;
		top: number;
		width: number;
		height: number;
		color: string;
	};
}

interface ListViewDragChipProps {
	clientId: string;
	count: number;
	id: string;
	snapshot?: DragChipSnapshot;
}

const noop = () => {};

// How far past the left or right edge of the list view the cursor can go
// before the chip swaps to the block chip used in the canvas.
const SWAP_THRESHOLD = 0;

/**
 * Returns the ID of the drag chip for a given list view instance.
 *
 * @param listViewInstanceId The list view instance ID.
 * @return The element ID of the drag chip.
 */
export function getDragChipId( listViewInstanceId: string | number ) {
	return `block-editor-list-view-drag-chip-${ listViewInstanceId }`;
}

/**
 * Returns the first non-transparent background color of an element or its
 * ancestors.
 *
 * @param element The element to start from.
 * @return The computed background color, if one is found.
 */
function getOpaqueBackgroundColor( element: Element ) {
	const { defaultView } = element.ownerDocument;
	for (
		let node: Element | null = element;
		node;
		node = node.parentElement
	) {
		const color = defaultView?.getComputedStyle( node ).backgroundColor;
		if (
			color &&
			color !== 'transparent' &&
			! /^rgba\(.*,\s*0\)$/.test( color )
		) {
			return color;
		}
	}
	return undefined;
}

/**
 * Takes a snapshot of the row being dragged, used to position and color the
 * drag chip. The chip is rendered in a portal outside the list view, so it
 * doesn't pick up styles scoped to the list view's ancestors (for example, a
 * dark sidebar). Copying the computed colors keeps it looking like the row.
 *
 * @param event           The drag start event.
 * @param listViewElement The list view tree element.
 * @return The snapshot, or undefined if the row isn't found.
 */
export function getDragChipSnapshot(
	event: DragEvent< HTMLElement >,
	listViewElement?: HTMLElement | null
): DragChipSnapshot | undefined {
	const handle = event.currentTarget;
	const row = handle?.closest( '.block-editor-list-view-leaf' );
	if ( ! row ) {
		return undefined;
	}

	const { defaultView } = row.ownerDocument;
	const handleStyle = defaultView?.getComputedStyle( handle );
	// A selected row uses the selection colors, so take the text color from
	// the list view instead.
	const colorSource = row.classList.contains( 'is-selected' )
		? ( listViewElement ?? row )
		: handle;

	const rect = row.getBoundingClientRect();

	// The menu and mover cells keep their width when hidden, so measure the
	// contents cell to keep the chip's contents the same width as the row's.
	const contentsCell = row.querySelector(
		'.block-editor-list-view-block__contents-cell'
	);

	// The menu button is shown while the row is hovered, which it is when the
	// drag starts, so draw it in the chip at the same position.
	const menuButton = row.querySelector(
		'.block-editor-list-view-block__menu'
	);
	let menu;
	if ( menuButton ) {
		const menuRect = menuButton.getBoundingClientRect();
		menu = {
			left: menuRect.left - rect.left,
			top: menuRect.top - rect.top,
			width: menuRect.width,
			height: menuRect.height,
			color: defaultView?.getComputedStyle( menuButton ).color ?? '',
		};
	}

	return {
		rect,
		listViewRect: listViewElement?.getBoundingClientRect(),
		clientX: event.clientX,
		clientY: event.clientY,
		level: row.getAttribute( 'aria-level' ),
		isExpanded: row.getAttribute( 'data-expanded' ),
		color: defaultView?.getComputedStyle( colorSource ).color ?? '',
		background: getOpaqueBackgroundColor( listViewElement ?? row ),
		padding: handleStyle?.padding ?? '',
		borderRadius: handleStyle?.borderRadius ?? '',
		contentsWidth: contentsCell?.getBoundingClientRect().width,
		menu,
	};
}

/**
 * A copy of a list view row that follows the cursor while it is dragged. Once
 * the cursor leaves the list view horizontally (for example, over the canvas),
 * it swaps to the block chip used in the canvas.
 *
 * @param props          Component props.
 * @param props.clientId The client ID of the dragged row.
 * @param props.count    The number of blocks being dragged.
 * @param props.id       The element ID of the chip.
 * @param props.snapshot The result of `getDragChipSnapshot` for this drag.
 */
export default function ListViewDragChip( {
	clientId,
	count,
	id,
	snapshot,
}: ListViewDragChipProps ) {
	const ref = useRef< HTMLDivElement >( null );
	const [ isOutsideListView, setIsOutsideListView ] = useState( false );
	const blockInformation = useBlockDisplayInformation( clientId );
	const listViewRect = snapshot?.listViewRect;

	// Events from the canvas iframe are forwarded to the parent document with
	// adjusted coordinates, so listening there covers the canvas too.
	useEffect( () => {
		const ownerDocument = ref.current?.ownerDocument;
		if ( ! ownerDocument || ! listViewRect ) {
			return;
		}
		function onDragOver( event: globalThis.DragEvent ) {
			setIsOutsideListView(
				event.clientX < listViewRect!.left - SWAP_THRESHOLD ||
					event.clientX > listViewRect!.right + SWAP_THRESHOLD
			);
		}
		ownerDocument.addEventListener( 'dragover', onDragOver );
		return () => {
			ownerDocument.removeEventListener( 'dragover', onDragOver );
		};
	}, [ listViewRect ] );

	if ( isOutsideListView ) {
		return (
			<div ref={ ref } aria-hidden>
				<BlockDraggableChip
					count={ count }
					icon={ blockInformation?.icon }
					fadeWhenDisabled
				/>
			</div>
		);
	}

	// The drag wrapper is placed at the cursor, so offset the chip by the
	// distance between the cursor and the row when the drag started.
	const style = snapshot
		? ( {
				width: snapshot.rect.width,
				height: snapshot.rect.height,
				transform: `translate( ${
					snapshot.rect.left - snapshot.clientX
				}px, ${ snapshot.rect.top - snapshot.clientY }px )`,
				'--block-editor-list-view-drag-chip-color': snapshot.color,
				'--block-editor-list-view-drag-chip-background':
					snapshot.background,
				'--block-editor-list-view-drag-chip-padding': snapshot.padding,
				'--block-editor-list-view-drag-chip-radius':
					snapshot.borderRadius,
				'--block-editor-list-view-drag-chip-contents-width':
					snapshot.contentsWidth !== undefined
						? `${ snapshot.contentsWidth }px`
						: undefined,
			} as CSSProperties )
		: undefined;

	return (
		<div
			ref={ ref }
			id={ id }
			className="block-editor-list-view-drag-chip"
			style={ style }
			aria-hidden
		>
			<div
				className="block-editor-list-view-leaf"
				aria-level={
					snapshot?.level ? Number( snapshot.level ) : undefined
				}
				data-expanded={ snapshot?.isExpanded ?? undefined }
			>
				<ListViewBlockSelectButton
					className="block-editor-list-view-block-contents"
					clientId={ clientId }
					onClick={ noop }
					onToggleExpanded={ noop }
					isExpanded={ snapshot?.isExpanded === 'true' }
					tabIndex={ -1 }
				/>
				{ snapshot?.menu && (
					<span
						className="block-editor-list-view-drag-chip__menu"
						style={ {
							left: snapshot.menu.left,
							top: snapshot.menu.top,
							width: snapshot.menu.width,
							height: snapshot.menu.height,
							color: snapshot.menu.color,
						} }
					>
						<Icon icon={ moreVertical } />
					</span>
				) }
				{ count > 1 && (
					<span className="block-editor-list-view-drag-chip__count">
						{ count }
					</span>
				) }
			</div>
		</div>
	);
}
