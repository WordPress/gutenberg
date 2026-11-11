import { getClosestTrack } from './utils';
import { getRotatedBoundingRect } from '../../utils/rotation';
import type { GridItemLayout } from './types';

/**
 * How close, in pixels, an edge must be to a grid line to count as on it.
 * The canvas measures blocks in whole pixels, so an edge on a line can be
 * measured up to a pixel away from it.
 */
export const EDGE_EPSILON = 1;

/**
 * How far past its cells, as a fraction of their width, a stored box can end.
 * Box values are rounded, so a box that ends on its cells' edge can add up to
 * a little more than them.
 */
const BOX_ROUNDING_TOLERANCE = 0.001;

/** A grid track, in pixels from the start of the first track. */
export interface GridTrack {
	start: number;
	end: number;
}

/** A rectangle in pixels, relative to the start of the first grid tracks. */
export interface PixelRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export type PixelRectEdge = keyof PixelRect;

/**
 * A corner of a pixel rectangle, combining two perpendicular edges.
 */
export type PixelRectCorner =
	'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/**
 * A corner or an edge of a pixel rectangle.
 */
export type PixelRectHandle = PixelRectEdge | PixelRectCorner;

/**
 * Maps a corner to its two constituent edges.
 */
const CORNER_EDGES: Record< PixelRectCorner, PixelRectEdge[] > = {
	topLeft: [ 'left', 'top' ],
	topRight: [ 'right', 'top' ],
	bottomLeft: [ 'left', 'bottom' ],
	bottomRight: [ 'right', 'bottom' ],
};

/**
 * Where a block is inside its cells, as fractions of the cells' area. The
 * offsets are fractions of the area's width, because that is what CSS
 * resolves margin percentages against.
 */
export interface GridItemBox {
	/** Offset from the area's left edge, as a fraction of its width. */
	left: number;
	/** Offset from the area's top edge, as a fraction of its width. */
	top: number;
	/** Width, as a fraction of the area's width. */
	width: number;
	/** Height, as a fraction of the area's height. */
	height: number;
}

/**
 * A block's place in a manual grid. The cells are the smallest range that
 * contains the block. A block that doesn't fill them has a box inside them.
 */
export interface GridPlacement {
	columnStart: number;
	columnSpan: number;
	rowStart: number;
	rowSpan: number;
	box?: GridItemBox;
}

function round( value: number ): number {
	return Math.round( value * 1e4 ) / 1e4;
}

/**
 * Gets the index of the last track that starts at or before a position.
 *
 * @param tracks   Grid tracks.
 * @param position Position in pixels.
 *
 * @return The 0-based track index.
 */
function getStartTrack( tracks: GridTrack[], position: number ): number {
	let index = 0;
	tracks.forEach( ( track, i ) => {
		if ( track.start <= position + EDGE_EPSILON ) {
			index = i;
		}
	} );
	return index;
}

/**
 * Gets the index of the first track that ends at or after a position.
 *
 * @param tracks   Grid tracks.
 * @param position Position in pixels.
 *
 * @return The 0-based track index.
 */
function getEndTrack( tracks: GridTrack[], position: number ): number {
	const index = tracks.findIndex(
		( track ) => track.end >= position - EDGE_EPSILON
	);
	return index === -1 ? tracks.length - 1 : index;
}

/**
 * Gets a block's place in a grid from its rectangle in pixels: the smallest
 * range of cells that contains it and, when it doesn't fill them, its box
 * inside them.
 *
 * @param pixelRect    The block's rectangle.
 * @param columnTracks Column tracks.
 * @param rowTracks    Row tracks.
 *
 * @return The block's place.
 */
export function getGridPlacementFromPixelRect(
	pixelRect: PixelRect,
	columnTracks: GridTrack[],
	rowTracks: GridTrack[]
): GridPlacement {
	const columnStart = getStartTrack( columnTracks, pixelRect.left );
	const columnEnd = Math.max(
		columnStart,
		getEndTrack( columnTracks, pixelRect.right )
	);
	const rowStart = getStartTrack( rowTracks, pixelRect.top );
	const rowEnd = Math.max(
		rowStart,
		getEndTrack( rowTracks, pixelRect.bottom )
	);
	const placement: GridPlacement = {
		columnStart: columnStart + 1,
		columnSpan: columnEnd - columnStart + 1,
		rowStart: rowStart + 1,
		rowSpan: rowEnd - rowStart + 1,
	};

	const area: PixelRect = {
		left: columnTracks[ columnStart ].start,
		top: rowTracks[ rowStart ].start,
		right: columnTracks[ columnEnd ].end,
		bottom: rowTracks[ rowEnd ].end,
	};
	// An edge measured just outside its cells is on their edge, so the box
	// never starts before its cells or reaches past them.
	const rect: PixelRect = {
		left: Math.max( pixelRect.left, area.left ),
		top: Math.max( pixelRect.top, area.top ),
		right: Math.min( pixelRect.right, area.right ),
		bottom: Math.min( pixelRect.bottom, area.bottom ),
	};
	const edges: PixelRectEdge[] = [ 'left', 'top', 'right', 'bottom' ];
	const fillsArea = edges.every(
		( edge ) => Math.abs( rect[ edge ] - area[ edge ] ) <= EDGE_EPSILON
	);
	if ( fillsArea ) {
		return placement;
	}

	const areaWidth = area.right - area.left;
	const areaHeight = area.bottom - area.top;
	return {
		...placement,
		box: {
			left: round( ( rect.left - area.left ) / areaWidth ),
			top: round( ( rect.top - area.top ) / areaWidth ),
			width: round( ( rect.right - rect.left ) / areaWidth ),
			height: round( ( rect.bottom - rect.top ) / areaHeight ),
		},
	};
}

/**
 * Gets a block's rectangle in pixels from its place in a grid, including its
 * box.
 *
 * @param placement    The block's place.
 * @param columnTracks Column tracks.
 * @param rowTracks    Row tracks.
 *
 * @return The rectangle, or null if the cells are outside the tracks.
 */
export function getPixelRectFromGridPlacement(
	placement: Partial< GridPlacement > &
		Pick< GridPlacement, 'columnStart' | 'rowStart' >,
	columnTracks: GridTrack[],
	rowTracks: GridTrack[]
): PixelRect | null {
	const {
		columnStart,
		columnSpan = 1,
		rowStart,
		rowSpan = 1,
		box,
	} = placement;
	const firstColumn = columnTracks[ columnStart - 1 ];
	const lastColumn = columnTracks[ columnStart + columnSpan - 2 ];
	const firstRow = rowTracks[ rowStart - 1 ];
	const lastRow = rowTracks[ rowStart + rowSpan - 2 ];
	if ( ! firstColumn || ! lastColumn || ! firstRow || ! lastRow ) {
		return null;
	}
	const area: PixelRect = {
		left: firstColumn.start,
		top: firstRow.start,
		right: lastColumn.end,
		bottom: lastRow.end,
	};
	if ( ! box ) {
		return area;
	}
	const areaWidth = area.right - area.left;
	const areaHeight = area.bottom - area.top;
	const left = area.left + box.left * areaWidth;
	const top = area.top + box.top * areaWidth;
	return {
		left,
		top,
		right: left + box.width * areaWidth,
		bottom: top + box.height * areaHeight,
	};
}

/**
 * Splits a size into tracks of the same size, with gaps between them.
 *
 * @param options
 * @param options.count Number of tracks.
 * @param options.size  Size of all the tracks and gaps, in pixels.
 * @param options.gap   Gap between tracks, in pixels.
 *
 * @return The tracks.
 */
export function getEqualTracks( {
	count,
	size,
	gap,
}: {
	count: number;
	size: number;
	gap: number;
} ): GridTrack[] {
	const trackSize = ( size - gap * ( count - 1 ) ) / count;
	return Array.from( { length: count }, ( _, index ) => {
		const start = index * ( trackSize + gap );
		return { start, end: start + trackSize };
	} );
}

/**
 * Adds tracks the average size of the existing ones until they reach a
 * position, as a grid does when a block is resized past its last row.
 *
 * @param tracks   Grid tracks.
 * @param position Position in pixels.
 * @param gap      Gap between tracks, in pixels.
 *
 * @return The tracks, with any added ones.
 */
export function extendTracks(
	tracks: GridTrack[],
	position: number,
	gap: number
): GridTrack[] {
	if ( ! tracks.length ) {
		return tracks;
	}
	const averageSize =
		tracks.reduce(
			( total, track ) => total + track.end - track.start,
			0
		) / tracks.length;
	const extended = [ ...tracks ];
	while ( extended[ extended.length - 1 ].end < position - EDGE_EPSILON ) {
		const start = extended[ extended.length - 1 ].end + gap;
		extended.push( { start, end: start + averageSize } );
	}
	return extended;
}

/**
 * Moves a rectangle, without resizing it, so that its outline with a
 * rotation is inside some bounds. A rectangle bigger than the bounds is
 * aligned to their top left.
 *
 * @param pixelRect The rectangle, without its rotation.
 * @param bounds    The bounds.
 * @param angle     The rotation in degrees.
 *
 * @return The moved rectangle.
 */
export function clampPixelRect(
	pixelRect: PixelRect,
	bounds: PixelRect,
	angle = 0
): PixelRect {
	const outline: PixelRect = getRotatedBoundingRect( pixelRect, angle );
	// When the outline is bigger than the bounds, the lower limit wins, which
	// aligns it to the top left.
	const x = Math.max(
		bounds.left - outline.left,
		Math.min( 0, bounds.right - outline.right )
	);
	const y = Math.max(
		bounds.top - outline.top,
		Math.min( 0, bounds.bottom - outline.bottom )
	);
	return {
		left: pixelRect.left + x,
		top: pixelRect.top + y,
		right: pixelRect.right + x,
		bottom: pixelRect.bottom + y,
	};
}

/**
 * Moves a rectangle's top-left corner to the closest track starts, keeping
 * its size.
 *
 * @param pixelRect    The rectangle.
 * @param columnTracks Column tracks.
 * @param rowTracks    Row tracks.
 *
 * @return The moved rectangle.
 */
export function snapPixelRectPosition(
	pixelRect: PixelRect,
	columnTracks: GridTrack[],
	rowTracks: GridTrack[]
): PixelRect {
	const left =
		columnTracks[ getClosestTrack( columnTracks, pixelRect.left ) ].start;
	const top = rowTracks[ getClosestTrack( rowTracks, pixelRect.top ) ].start;
	return {
		left,
		top,
		right: left + pixelRect.right - pixelRect.left,
		bottom: top + pixelRect.bottom - pixelRect.top,
	};
}

/**
 * Moves some of a rectangle's edges to the closest grid lines: left and top
 * edges to track starts, right and bottom edges to track ends.
 *
 * @param pixelRect    The rectangle.
 * @param edges        The edges to move.
 * @param columnTracks Column tracks.
 * @param rowTracks    Row tracks.
 *
 * @return The rectangle with the edges moved.
 */
export function snapPixelRectEdges(
	pixelRect: PixelRect,
	edges: PixelRectEdge[],
	columnTracks: GridTrack[],
	rowTracks: GridTrack[]
): PixelRect {
	const snapped = { ...pixelRect };
	for ( const edge of edges ) {
		const tracks =
			edge === 'left' || edge === 'right' ? columnTracks : rowTracks;
		const side = edge === 'left' || edge === 'top' ? 'start' : 'end';
		snapped[ edge ] =
			tracks[ getClosestTrack( tracks, pixelRect[ edge ], side ) ][
				side
			];
	}
	return snapped;
}

/**
 * Gets a resized block's place in a grid with cells of a fixed size. The
 * block keeps the size it was resized to, inside the grid's left, top and
 * right edges. Past the last row, the grid grows, so its bottom edge can go
 * further. With `snap`, the edge being dragged snaps to the closest grid line.
 *
 * @param options
 * @param options.pixelRect    The resized block's rectangle.
 * @param options.direction    The handle being dragged (edge or corner).
 * @param options.columnTracks Column tracks.
 * @param options.rowTracks    Row tracks.
 * @param options.rowGap       Row gap in pixels.
 * @param options.snap         Whether to snap the dragged handle.
 *
 * @return The block's place.
 */
export function getResizedGridPlacement( {
	pixelRect,
	direction,
	columnTracks,
	rowTracks,
	rowGap,
	snap,
}: {
	pixelRect: PixelRect;
	direction: PixelRectHandle;
	columnTracks: GridTrack[];
	rowTracks: GridTrack[];
	rowGap: number;
	snap: boolean;
} ): GridPlacement {
	const gridRight = columnTracks[ columnTracks.length - 1 ].end;
	let rect: PixelRect = {
		left: Math.max( pixelRect.left, 0 ),
		top: Math.max( pixelRect.top, 0 ),
		right: Math.min( pixelRect.right, gridRight ),
		bottom: pixelRect.bottom,
	};
	// A corner maps to both of its edges, so both snap together.
	const edges: PixelRectEdge[] = (
		( direction as PixelRectCorner ) in CORNER_EDGES
			? CORNER_EDGES[ direction as PixelRectCorner ]
			: [ direction ]
	) as PixelRectEdge[];
	if ( snap ) {
		rect = snapPixelRectEdges(
			rect,
			edges,
			columnTracks,
			extendTracks( rowTracks, rect.bottom, rowGap )
		);
	}
	return getGridPlacementFromPixelRect(
		rect,
		columnTracks,
		extendTracks( rowTracks, rect.bottom, rowGap )
	);
}

/**
 * The child layout keys that place a block in a grid.
 */
export const GRID_PLACEMENT_KEYS = [
	'columnStart',
	'columnSpan',
	'rowStart',
	'rowSpan',
];

/**
 * Gets the box of a manual grid item in a state: where it is inside its
 * cells when it doesn't fill them. The box belongs to the placement, so a
 * viewport override that sets any part of the placement also sets the box,
 * and has none if it doesn't include one.
 *
 * @param layout            The item's base child layout.
 * @param viewportOverrides The child layout of a viewport, if any.
 *
 * @return The box, with `left`, `top`, `width` and `height`.
 */
export function getGridItemBox(
	layout: GridItemLayout = {},
	viewportOverrides?: GridItemLayout
): GridItemBox | undefined {
	const ownsPlacement =
		viewportOverrides &&
		GRID_PLACEMENT_KEYS.some( ( key ) =>
			Object.hasOwn( viewportOverrides, key )
		);
	const box = ( ownsPlacement ? viewportOverrides : layout )?.box;
	// The same check as the front end, so that the editor never shows a box
	// the front end ignores.
	if (
		! box ||
		( [ 'left', 'top', 'width', 'height' ] as const ).some(
			( key ) =>
				typeof box[ key ] !== 'number' ||
				! Number.isFinite( box[ key ] )
		) ||
		box.left < 0 ||
		box.left > 1 ||
		// The values are rounded, so the box can end a little past its cells,
		// but no more.
		box.left + box.width > 1 + BOX_ROUNDING_TOLERANCE ||
		box.top < 0 ||
		box.top > 100 ||
		box.width <= 0 ||
		box.width > 1 ||
		box.height <= 0 ||
		box.height > 1
	) {
		return undefined;
	}
	return box;
}
