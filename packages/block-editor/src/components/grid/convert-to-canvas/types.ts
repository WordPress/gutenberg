/**
 * The parts of a block the conversion reads.
 */
export interface CanvasBlock {
	clientId: string;
	name: string;
	attributes: Record< string, any >;
	innerBlocks: CanvasBlock[];
}

/**
 * A block, or a run of text blocks, that becomes one item of the canvas.
 */
export interface CanvasItem {
	/** A block kept as it is, or text blocks gathered in a new Stack. */
	type: 'block' | 'stack';
	/** The block, or the blocks in the Stack. */
	blocks: CanvasBlock[];
	/**
	 * For a Stack made from a Column, the Column, which gives it its
	 * rectangle and look.
	 */
	column?: CanvasBlock;
	/** Dissolved containers between the canvas and the item, outermost first. */
	ancestors: CanvasBlock[];
	/** For a Column, its vertical alignment, or that of its Columns. */
	verticalAlignment?: string;
}

/**
 * A rectangle on screen, relative to the canvas's content box.
 */
export interface Rect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * One step that narrows a frame down to an item, in line space (see
 * `get-horizontal-fractions.ts`).
 *
 * `split` takes the part of the frame from `start` to `end`, as fractions of
 * it (a Column of Columns). `center`, `start` and `end` take a part of the
 * frame `size` wide, centered or against one of its edges (children of a
 * constrained layout). `measured` is where the item was on screen, as
 * fractions of the canvas, and replaces any other step.
 */
export type HorizontalStep =
	| { type: 'split'; start: number; end: number }
	| { type: 'measured'; start: number; end: number }
	| { type: 'center' | 'start' | 'end'; size: number };

/**
 * Rows of an item.
 */
export interface Rows {
	rowStart: number;
	rowSpan: number;
}

/**
 * Where an item goes in the canvas, and its rows on tablets when they differ.
 */
export interface Place {
	layout: Rows & { columnStart: number; columnSpan: number };
	tabletLayout?: Rows;
}

/**
 * Gets a block's element in the editor canvas.
 */
export type GetElement = ( clientId: string ) => HTMLElement | undefined;
