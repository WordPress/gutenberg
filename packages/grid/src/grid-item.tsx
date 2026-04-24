/**
 * External dependencies
 */
import { useSortable } from '@dnd-kit/sortable';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ResizeHandle from './resize-handle';
import type { DashboardGridLayoutItem } from './types';
import styles from './grid-item.module.css';

type GridItemProps = {
	/**
	 * The layout item containing grid positioning information.
	 */
	item: DashboardGridLayoutItem;

	/**
	 * The maximum number of columns in the grid.
	 */
	maxColumns: number;

	/**
	 * Whether drag and resize interactions are disabled.
	 *
	 * @default false
	 */
	disabled?: boolean;

	/**
	 * Whether the item can be resized vertically. Disabled when the
	 * grid uses `rowHeight: 'auto'`, where row height is driven by
	 * content rather than by the user.
	 *
	 * @default true
	 */
	verticalResizable?: boolean;

	/**
	 * The content to be displayed within the grid item.
	 */
	children: React.ReactNode;

	/**
	 * Content rendered above the draggable area that remains interactive
	 * during edit mode. Useful for controls like action buttons, inputs,
	 * or links that need to stay actionable.
	 */
	actionableArea?: React.ReactNode;

	/**
	 * Callback fired when the item is being resized.
	 *
	 * @param delta - The width and height change in grid units.
	 */
	onResize: ( delta: { width: number; height: number } ) => void;

	/**
	 * Callback fired when resize operation ends.
	 */
	onResizeEnd: () => void;
};

export function GridItem( {
	item,
	maxColumns,
	disabled = false,
	verticalResizable = true,
	children,
	actionableArea = null,
	onResize,
	onResizeEnd,
}: GridItemProps ) {
	const [ previewDelta, setPreviewDelta ] = useState< {
		width: number;
		height: number;
	} | null >( null );
	const { attributes, listeners, setNodeRef, isDragging } = useSortable( {
		id: item.key,
		disabled,
	} );
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
		cursor: disabled ? 'default' : 'grab',
	};

	const itemClassName = clsx(
		styles.item,
		isDragging && styles[ 'is-dragging' ]
	);

	const handleResize = ( delta: { width: number; height: number } ) => {
		const clamped = {
			width: delta.width,
			height: verticalResizable ? delta.height : 0,
		};
		setPreviewDelta( clamped );
		onResize( clamped );
	};

	const handleResizeEnd = () => {
		setPreviewDelta( null );
		onResizeEnd();
	};

	const previewOverlay = previewDelta ? (
		<div
			className={ styles[ 'preview-overlay' ] }
			style={ {
				insetInlineEnd: -previewDelta.width,
				bottom: -previewDelta.height,
			} }
		/>
	) : null;

	return (
		<div
			ref={ setNodeRef }
			className={ itemClassName }
			style={ style }
			{ ...attributes }
		>
			{ actionableArea }

			<div { ...listeners } style={ { height: '100%' } }>
				<div className={ styles[ 'item-content' ] }>
					{ children }
					<ResizeHandle
						disabled={ disabled }
						itemId={ item.key }
						verticalResizable={ verticalResizable }
						onResize={ handleResize }
						onResizeEnd={ handleResizeEnd }
					/>
				</div>
				{ previewOverlay }
			</div>
		</div>
	);
}
