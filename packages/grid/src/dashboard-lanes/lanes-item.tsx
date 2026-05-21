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
import ResizeHandle from '../shared/resize-handle';
import { clampResizeDelta, type ResizeSnapSize } from '../shared/resize-snap';
import { GRID_ITEM_DATA_KEY } from '../shared/grid-item-key';
import type { ResizeDelta, ResizeHandleRenderProps } from '../shared/types';
import styles from './lanes-item.module.css';

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

/**
 * Props for the internal `<LanesItem />` wrapper.
 */
export type LanesItemProps = {
	/**
	 * Item key. Forwarded to dnd-kit and emitted as the
	 * `data-wp-grid-item-key` attribute the hook reads to map measured DOM
	 * nodes back to logical items.
	 */
	itemKey: string;

	/**
	 * Inline placement style produced by `useLanePlacement`. On native
	 * (`display: grid-lanes`), only `gridColumn: span N`. While
	 * polyfilling, also `gridColumnStart` / `gridRowStart` /
	 * `gridRowEnd: span N`.
	 */
	placementStyle: React.CSSProperties;

	/**
	 * Whether drag and resize interactions are disabled.
	 */
	disabled?: boolean;

	/**
	 * Whether any tile in the surface is currently being dragged or
	 * resized. Drives the drag activator cursor.
	 */
	interacting?: boolean;

	/**
	 * Whether a tile drag is in progress. Mutes each tile's
	 * `actionableArea` with `inert` so hovers on other tiles' controls
	 * do not steal the gesture.
	 *
	 * @default false
	 */
	dragging?: boolean;

	children: React.ReactNode;

	actionableArea?: React.ReactNode;

	onResize: ( id: string, delta: ResizeDelta ) => void;

	/**
	 * Snapped column span in pixels for the resize-preview outline.
	 */
	resizeSnapPreview?: ResizeSnapSize | null;

	/**
	 * Minimum tile width while resizing, in pixels (one column track).
	 */
	minResizeWidthPx: number;

	onResizeEnd: () => void;

	renderResizeHandle?: React.ComponentType< ResizeHandleRenderProps >;
};

export function LanesItem( {
	itemKey,
	placementStyle,
	disabled = false,
	interacting = false,
	children,
	actionableArea = null,
	onResize,
	onResizeEnd,
	resizeSnapPreview = null,
	minResizeWidthPx,
	renderResizeHandle,
	dragging = false,
}: LanesItemProps ) {
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
		id: itemKey,
		disabled,
	} );
	const mergedRef = useMergeRefs( [ itemRef, setNodeRef ] );
	const contentMergedRef = useMergeRefs( [ contentRef ] );

	const style: React.CSSProperties = {
		...placementStyle,
		alignSelf: 'start',
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
		let clamped: ResizeDelta = { width: delta.width, height: 0 };
		if ( baselineSize ) {
			clamped = clampResizeDelta( clamped, baselineSize, {
				width: minResizeWidthPx,
			} );
		}
		setResizeDelta( clamped );
		onResize( itemKey, clamped );
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
			  }
			: undefined;

	const previewOverlay = resizeSnapPreview ? (
		<div
			className={ styles[ 'preview-overlay' ] }
			style={ {
				width: resizeSnapPreview.widthPx,
				height: resizeSnapPreview.heightPx ?? '100%',
			} }
		/>
	) : null;

	return (
		<div
			ref={ mergedRef }
			className={ itemClassName }
			style={ style }
			{ ...{ [ GRID_ITEM_DATA_KEY ]: itemKey } }
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
							itemId={ itemKey }
							verticalResizable={ false }
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
