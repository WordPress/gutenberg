import type { CSSProperties, ReactNode, Ref, RefObject } from 'react';
import type { Layout } from '../../layouts/types';
import type { AlignmentGuide } from './get-alignment-guides';
import type { GridItemBox, GridPlacement } from './free-placement';
import type { GridRect } from './utils';

/**
 * The position and size of a block within its grid, from `style.layout`.
 */
export interface GridItemLayout {
	columnStart?: number;
	rowStart?: number;
	columnSpan?: number;
	rowSpan?: number;
	/** Where a block placed freely in a manual grid is inside its cells. */
	box?: GridItemBox;
	[ key: string ]: unknown;
}

/**
 * Attributes of a grid item block, positioned by `style.layout`.
 */
export interface GridItemAttributes {
	style?: { layout?: GridItemLayout; [ key: string ]: unknown };
	[ key: string ]: unknown;
}

/**
 * The area of a grid a `GridRect` covers. Spans take precedence over ends.
 */
export interface GridRectOptions {
	columnStart?: number;
	rowStart?: number;
	columnEnd?: number;
	rowEnd?: number;
	columnSpan?: number;
	rowSpan?: number;
}

/**
 * The start and end position in pixels of a grid track.
 */
export interface GridTrack {
	start: number;
	end: number;
}

/**
 * A rectangle in pixels, relative to a grid's content box.
 */
export interface GridPixelRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * The size, color and template of a grid.
 */
export interface GridInfo {
	numColumns: number;
	numRows: number;
	numItems: number;
	currentColor: string;
	style: CSSProperties;
}

/**
 * The sides a grid item can be resized from.
 */
export interface GridItemResizerSides {
	top: boolean;
	bottom: boolean;
	left: boolean;
	right: boolean;
}

export interface GridItemResizerProps {
	/** Client ID of the grid item block. */
	clientId: string;
	/** Bounds the resizer cannot exceed. */
	bounds?: 'window' | 'parent' | HTMLElement;
	/** Called with the new position and size of the grid item. */
	onChange: ( layout: GridItemLayout ) => void;
	/** Layout of the grid block. */
	parentLayout: Layout;
	/** Rotation of the grid item in degrees, which the handles follow. */
	angle?: number;
}

export interface GridItemResizerInnerProps extends Omit<
	GridItemResizerProps,
	'parentLayout'
> {
	blockElement: HTMLElement;
	rootBlockElement: HTMLElement;
	isManualGrid?: boolean;
	angle: number;
}

export interface GridItemMoversProps {
	/** Position and size of the grid item. */
	layout?: GridItemLayout;
	/** Layout of the grid block. */
	parentLayout?: Layout;
	/** Called with the new position of the grid item. */
	onChange: ( layout: GridItemLayout ) => void;
	/** Client ID of the grid block. */
	gridClientId: string;
	/** Client ID of the grid item block. */
	blockClientId: string;
}

export interface GridItemMoverProps {
	className?: string;
	icon: React.JSX.Element;
	label: string;
	isDisabled?: boolean | 0 | null;
	onClick: () => void;
	description: string;
}

export interface GridVisualizerProps {
	/** Client ID of the grid block. */
	clientId: string;
	/** Ref to the element holding the grid cells. */
	contentRef?: Ref< HTMLDivElement >;
	/** Layout of the grid block. */
	parentLayout?: Layout;
	/** Client ID of a selected child that is itself a grid. */
	childGridClientId?: string;
}

export interface GridVisualizerGridProps {
	gridClientId: string;
	gridElement: Element;
	isManualGrid?: boolean;
	childGridClientId?: string;
}

export interface GridVisualizerCellProps {
	/** The grid's text color. */
	color: string;
	/**
	 * Lines in the grid's text color, a square that stands out on any
	 * background while a block is dragged into the grid, or no lines.
	 */
	lineStyle?: 'color' | 'contrasting' | 'none';
	/** The cell's content. */
	children?: ReactNode;
}

/**
 * A cell of a manual grid.
 */
export interface GridVisualizerCellPosition {
	column: number;
	row: number;
	gridClientId: string;
	gridInfo: GridInfo;
}

/**
 * The inserter of a cell of a manual grid, or of cells selected by drawing
 * across the grid.
 */
export interface GridVisualizerAppenderProps extends GridVisualizerCellPosition {
	/** Number of columns the inserted block covers. */
	columnSpan?: number;
	/** Number of rows the inserted block covers. */
	rowSpan?: number;
	/** The grid element in the canvas. */
	gridElement: Element;
	/** Whether the inserter opens as soon as it renders. */
	isInitiallyOpen?: boolean;
	/** Called when the inserter closes, with or without a block inserted. */
	onClose?: () => void;
}

export interface GridVisualizerMarqueeProps {
	/** Client ID of the grid block. */
	gridClientId: string;
	/** The grid element in the canvas. */
	gridElement: Element;
	/** Grid info, from `getGridInfo`. */
	gridInfo: GridInfo;
}

/**
 * Cells selected by drawing across a manual grid.
 */
export interface GridMarquee {
	/** The selected cells. */
	rect: GridRect;
	/** Whether the press is over and the inserter for the cells is open. */
	isInserting: boolean;
}

/**
 * A press that draws across the cells of a manual grid.
 */
export interface GridMarqueeDrag {
	pointerId: number;
	/** The cell the press started on. */
	start: GridRect;
	/** Whether the pointer has left the cell it was pressed on. */
	isMoving: boolean;
	/** Whether Escape was pressed during the press. */
	isCancelled?: boolean;
}

/**
 * The selectors that tell whether a grid can take blocks dragged from an
 * inserter.
 */
export interface InserterBlockSelectors {
	canInsertBlockType: ( blockName: string, rootClientId: string ) => boolean;
}

/**
 * Where a dragged block was grabbed, in pixels from its top-left corner. Empty
 * when it wasn't grabbed by its body, so it is centered on the pointer.
 */
export interface GridDragGrab {
	/** Client ID of the dragged block, or null for blocks from an inserter. */
	srcClientId: string | null;
	grab: { grabX?: number; grabY?: number };
}

/**
 * A block in a grid, other than the dragged one, as measured in the canvas.
 */
export interface GridSibling {
	/** The block's position in pixels. */
	pixelRect: GridPixelRect;
	/** The cells the block covers. */
	rect: GridRect;
}

/**
 * A grid's tracks and blocks, measured in the canvas when a drag starts.
 * Nothing in the grid moves until the drop.
 */
export interface GridItemMeasurements {
	/** Column tracks. */
	columnTracks: GridTrack[];
	/** Row tracks. */
	rowTracks: GridTrack[];
	/** The blocks in the grid, other than the dragged one. */
	siblings: GridSibling[];
	/**
	 * The dragged block, unrotated, with its rotation in degrees, or null when
	 * it isn't in the grid.
	 */
	src: { pixelRect: GridPixelRect; rect: GridRect; angle: number } | null;
	/** Whether the grid's cells have a fixed size. */
	hasFixedCells: boolean;
}

/**
 * The cells a block dragged over a manual grid would land in.
 */
export interface GridDropTarget {
	/** Client ID of the dragged block, or null for blocks from an inserter. */
	srcClientId: string | null;
	/** Whether the blocks are dragged from an inserter, not in the canvas. */
	isInserterDrag: boolean;
	/** Number of columns and rows the block spans. */
	span: { columnSpan: number; rowSpan: number };
	/** The cells the block would land in. */
	landing: GridRect;
	/** The block's exact place when it is placed freely, or null. */
	placement: GridPlacement | null;
	/** The landing cells in pixels. */
	landingPixelRect: GridPixelRect;
	/** The parts of the landing cells other blocks take up, in pixels. */
	overlaps: GridPixelRect[];
	/** The alignment guides to show for the landing cells. */
	guides: AlignmentGuide[];
}

export interface GridVisualizerDropLayerProps {
	/** Client ID of the grid block. */
	gridClientId: string;
	/** The grid element in the canvas. */
	gridElement: Element;
	/** Grid info, from `getGridInfo`. */
	gridInfo: GridInfo;
}

/**
 * A move of a drag over a manual grid's drop layer, with what the drag's data
 * said when it happened.
 */
export interface GridDropLayerMove {
	clientX: number;
	clientY: number;
	/** Whether Shift was held, to snap a block placed freely. */
	shiftKey: boolean;
	/** Whether the block is dragged by a drag handle. */
	isHandleDrag: boolean;
	/** Client ID of the dragged block, if it can be placed in the grid. */
	srcClientId: string | null;
	/** Whether the drag is of blocks from an inserter that the grid allows. */
	isInserterDrag: boolean;
}

export interface GridDropIndicatorProps {
	dropTarget: GridDropTarget;
	/** Ref to the landing preview, which is moved without rendering. */
	landingRef: RefObject< HTMLDivElement | null >;
}

export interface AutoGridVisualizerProps {
	gridInfo: GridInfo;
	childGridRect: GridRect | null;
}

export interface ManualGridVisualizerProps extends AutoGridVisualizerProps {
	gridClientId: string;
	gridElement: Element;
}
