/**
 * External dependencies
 */
import { useSortable } from '@dnd-kit/sortable';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import actionableAreaStyles from '../shared/actionable-area-slot.module.css';
import { GRID_ITEM_DATA_KEY } from '../shared/grid-item-key';
import ResizeHandle from '../shared/resize-handle';
import { clampResizeDelta, type ResizeSnapSize } from '../shared/resize-snap';
import type { ResizeDelta } from '../shared/types';
import type { GridItemProps } from './types';
import styles from './grid-item.module.css';

function getItemCursor(
	disabled: boolean,
	interacting: boolean
): React.CSSProperties[ 'cursor' ] {
	if ( disabled ) {
		return 'default';
	}

	if ( interacting ) {
		return undefined;
	}

	return 'grab';
}

export function GridItem( {
	item,
	maxColumns,
	disabled = false,
	verticalResizable = true,
	interacting = false,
	dragging = false,
	children,
	actionableArea = null,
	onResize,
	onResizeEnd,
	resizeSnapPreview = null,
	minResizeWidthPx,
	minResizeHeightPx,
	renderResizeHandle,
}: GridItemProps ) {
	const [ resizeDelta, setResizeDelta ] = useState< ResizeDelta | null >(
		null
	);
	const [ initialContentSize, setInitialContentSize ] = useState< {
		width: number;
		height: number;
	} | null >( null );
	const itemRef = useRef< HTMLDivElement >( null );
	const contentRef = useRef< HTMLDivElement >( null );
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		isDragging,
	} = useSortable( {
		id: item.key,
		disabled,
	} );
	const mergedRef = useMergeRefs( [ itemRef, setNodeRef ] );
	const contentMergedRef = useMergeRefs( [ contentRef ] );
	/*
	 * With `<DragOverlay>` handling the cursor-following clone, the
	 * sortable item stays put in its grid cell and acts as a
	 * placeholder. No `transform` is applied here — applying one
	 * would double-move the placeholder alongside the overlay.
	 */
	const style = {
		gridColumnEnd: `span ${
			item.width === 'full'
				? maxColumns
				: Math.min(
						typeof item.width === 'number' ? item.width : 1,
						maxColumns
				  )
		}`,
		gridRowEnd: `span ${ item.height || 1 }`,
	};

	const isResizing = resizeDelta !== null;
	const itemClassName = clsx(
		styles.item,
		isDragging && styles[ 'is-dragging' ],
		isResizing && styles[ 'is-resizing' ]
	);

	const handleResize = ( delta: ResizeDelta ) => {
		const contentNode = contentRef.current;
		let baselineSize = initialContentSize;
		if ( contentNode && ! baselineSize ) {
			const { width, height } = contentNode.getBoundingClientRect();
			baselineSize = { width, height };
			setInitialContentSize( baselineSize );
		}
		let clamped: ResizeDelta = {
			width: delta.width,
			height: verticalResizable ? delta.height : 0,
		};
		if ( baselineSize ) {
			clamped = clampResizeDelta( clamped, baselineSize, {
				width: minResizeWidthPx,
				height: verticalResizable ? minResizeHeightPx : undefined,
			} );
		}
		setResizeDelta( clamped );
		onResize( item.key, clamped );
	};

	const handleResizeEnd = () => {
		setResizeDelta( null );
		setInitialContentSize( null );
		onResizeEnd();
	};

	const continuousContentStyle: React.CSSProperties | undefined =
		resizeDelta && initialContentSize
			? {
					width: initialContentSize.width + resizeDelta.width,
					height: verticalResizable
						? initialContentSize.height + resizeDelta.height
						: undefined,
			  }
			: undefined;

	const previewOverlay = resizeSnapPreview ? (
		<SnapPreviewOverlay snap={ resizeSnapPreview } />
	) : null;

	return (
		<div
			ref={ mergedRef }
			className={ itemClassName }
			style={ style }
			{ ...{ [ GRID_ITEM_DATA_KEY ]: item.key } }
			data-wp-grid-item-resizing={ isResizing || undefined }
		>
			{ actionableArea ? (
				<div
					className={ actionableAreaStyles[ 'actionable-area-slot' ] }
				>
					<div
						style={ { display: 'contents' } }
						{ ...( dragging ? { inert: '' } : {} ) }
					>
						{ actionableArea }
					</div>
				</div>
			) : null }

			<div
				ref={ setActivatorNodeRef }
				{ ...attributes }
				{ ...listeners }
				style={ {
					height: '100%',
					cursor: getItemCursor( disabled, interacting ),
				} }
			>
				<div
					ref={ contentMergedRef }
					className={ styles[ 'item-content' ] }
					style={ continuousContentStyle }
				>
					{ children }
					{ ! disabled && (
						<ResizeHandle
							itemId={ item.key }
							verticalResizable={ verticalResizable }
							onResize={ handleResize }
							onResizeEnd={ handleResizeEnd }
							renderResizeHandle={ renderResizeHandle }
						/>
					) }
				</div>
				{ previewOverlay }
			</div>
		</div>
	);
}

function SnapPreviewOverlay( { snap }: { snap: ResizeSnapSize } ) {
	return (
		<div
			className={ styles[ 'preview-overlay' ] }
			style={ {
				width: snap.widthPx,
				height: snap.heightPx ?? '100%',
			} }
		/>
	);
}
