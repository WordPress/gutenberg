/**
 * Horizontal positions are worked out in "line space": the canvas's content
 * box plus one trailing gap, scaled to 0–1. In that space a grid of `n`
 * columns puts its lines at exactly `k / n`, whatever its gap, so a span of
 * `k` of `n` columns is the fraction `k / n`, and two 6-column spans are
 * exactly two 50% columns with the same gap.
 *
 * Each item gets a list of steps that narrow the canvas down to the item,
 * one per container that positions it, taken from attributes where they say
 * exactly where the item is: Columns widths, and wide, content and justified
 * children of constrained layouts. Anything else is measured.
 */
import type { CanvasBlock, CanvasItem, HorizontalStep, Rect } from './types';

/**
 * An item's edges may be up to this many pixels, or one gap, from where its
 * steps put it before it is measured instead. Columns with unequal widths are
 * up to half a gap from the lines that represent their fractions.
 */
const MAX_STEP_ERROR = 6;

export interface HorizontalGeometry {
	/** Rectangles by client ID, relative to the canvas's content box. */
	rects: Map< string, Rect >;
	/** Client IDs of containers with horizontal padding or borders. */
	insets: Set< string >;
	/** Width of the canvas's content box. */
	width: number;
	/** The canvas's column gap. */
	gap: number;
}

/**
 * Gets the rectangle an item takes on screen: its block's, its Column's, or
 * the one around its run of text.
 *
 * @param item  The item.
 * @param rects Rectangles by client ID.
 * @return The rectangle.
 */
export function getItemRect( item: CanvasItem, rects: Map< string, Rect > ) {
	const memberRects = ( item.column ? [ item.column ] : item.blocks ).map(
		( block ) => rects.get( block.clientId ) as Rect
	);
	return {
		left: Math.min( ...memberRects.map( ( rect ) => rect.left ) ),
		top: Math.min( ...memberRects.map( ( rect ) => rect.top ) ),
		right: Math.max( ...memberRects.map( ( rect ) => rect.right ) ),
		bottom: Math.max( ...memberRects.map( ( rect ) => rect.bottom ) ),
	};
}

function getLayoutType( block: CanvasBlock ): string {
	const layout = block.attributes?.layout ?? {};
	if ( block.name === 'core/columns' ) {
		return 'columns';
	}
	if ( ! layout.type || layout.type === 'default' ) {
		return layout.inherit ? 'constrained' : 'flow';
	}
	return layout.type;
}

function hasHorizontalMargin( block: CanvasBlock ) {
	const margin = block.attributes?.style?.spacing?.margin;
	return !! ( margin?.left || margin?.right );
}

// A width as a fraction, `null` when there is none, and `undefined` when it
// isn't a percentage.
function parseColumnWidth( width: unknown ) {
	if ( width === undefined || width === null || width === '' ) {
		return null;
	}
	const match = String( width ).match( /^(\d*\.?\d+)%$/ );
	return match ? parseFloat( match[ 1 ] ) / 100 : undefined;
}

/**
 * Gets the fractions of Columns that its columns start and end at, from their
 * widths. Columns without a width share what is left.
 *
 * @param columns A Columns block.
 * @return The fractions, or `undefined` when a width is not a percentage.
 */
export function getColumnFractions(
	columns: CanvasBlock
): Array< { start: number; end: number } > | undefined {
	const widths = columns.innerBlocks.map( ( column ) =>
		parseColumnWidth( column.attributes?.width )
	);
	if ( widths.some( ( width ) => width === undefined ) ) {
		return undefined;
	}
	const set = widths.filter( ( width ): width is number => width !== null );
	const setTotal = set.reduce( ( sum, width ) => sum + width, 0 );
	const unsetCount = widths.length - set.length;
	const unsetWidth =
		unsetCount > 0 ? Math.max( 0, 1 - setTotal ) / unsetCount : 0;
	const resolved = widths.map( ( width ) => width ?? unsetWidth );
	const total = resolved.reduce( ( sum, width ) => sum + width, 0 );
	if ( ! total ) {
		return undefined;
	}
	let start = 0;
	return resolved.map( ( width ) => {
		const fraction = { start, end: start + width / total };
		start = fraction.end;
		return fraction;
	} );
}

/**
 * Narrows a frame, given as line space fractions of the canvas, by a step.
 *
 * @param frame The frame's start and end.
 * @param step  The step.
 * @return The narrowed frame.
 */
export function applyStep(
	frame: [ number, number ],
	step: HorizontalStep
): [ number, number ] {
	const [ start, end ] = frame;
	const size = end - start;
	switch ( step.type ) {
		case 'split':
			return [ start + size * step.start, start + size * step.end ];
		case 'measured':
			return [ step.start, step.end ];
		case 'center':
			return [
				start + ( size * ( 1 - step.size ) ) / 2,
				end - ( size * ( 1 - step.size ) ) / 2,
			];
		case 'start':
			return [ start, start + size * step.size ];
		case 'end':
			return [ end - size * step.size, end ];
	}
}

function areStepsEqual( a: HorizontalStep[], b: HorizontalStep[] ) {
	const tolerance = 0.005;
	return (
		a.length === b.length &&
		a.every( ( step, index ) => {
			const [ start, end ] = applyStep( [ 0, 1 ], step );
			const [ otherStart, otherEnd ] = applyStep( [ 0, 1 ], b[ index ] );
			return (
				step.type === b[ index ].type &&
				Math.abs( start - otherStart ) < tolerance &&
				Math.abs( end - otherEnd ) < tolerance
			);
		} )
	);
}

/**
 * Gets the steps that position a block in its parent.
 *
 * @param block    The block, or the Column a Stack is made from.
 * @param parent   The block's parent.
 * @param geometry Measurements.
 * @param isRoot   Whether the parent is the canvas.
 * @return The steps, or `undefined` when its attributes don't say where it is.
 */
function getStepsInParent(
	block: CanvasBlock,
	parent: CanvasBlock,
	geometry: HorizontalGeometry,
	isRoot: boolean
): HorizontalStep[] | undefined {
	const { rects, insets, width, gap } = geometry;
	if ( ! isRoot && insets.has( parent.clientId ) ) {
		return undefined;
	}
	if ( hasHorizontalMargin( block ) ) {
		return undefined;
	}
	const align = block.attributes?.align;
	if ( align === 'left' || align === 'right' ) {
		return undefined;
	}
	const getWidth = ( { clientId }: CanvasBlock ) => {
		const rect = rects.get( clientId );
		return rect ? rect.right - rect.left : undefined;
	};
	switch ( getLayoutType( parent ) ) {
		case 'columns': {
			const index = parent.innerBlocks.indexOf( block );
			const fractions = getColumnFractions( parent );
			const columnRects = parent.innerBlocks.map( ( column ) =>
				rects.get( column.clientId )
			);
			// Columns stacked on a narrow screen sit one above the other.
			const isStacked = columnRects.some(
				( rect, i ) =>
					i > 0 &&
					!! rect &&
					rect.top >= ( columnRects[ i - 1 ]?.bottom ?? 0 ) - 1
			);
			if ( index === -1 || ! fractions || isStacked ) {
				return undefined;
			}
			return [ { type: 'split', ...fractions[ index ] } ];
		}
		case 'constrained': {
			if ( align === 'full' ) {
				return [];
			}
			const parentWidth = isRoot ? width : getWidth( parent );
			const blockWidth = getWidth( block );
			if ( ! parentWidth || blockWidth === undefined ) {
				return undefined;
			}
			const size = Math.min(
				1,
				( blockWidth + gap ) / ( parentWidth + gap )
			);
			if ( align === 'wide' ) {
				return [ { type: 'center', size } ];
			}
			const justification = parent.attributes?.layout?.justifyContent;
			if ( justification === 'left' ) {
				return [ { type: 'start', size } ];
			}
			if ( justification === 'right' ) {
				return [ { type: 'end', size } ];
			}
			return [ { type: 'center', size } ];
		}
		case 'flow':
			return [];
	}
	return undefined;
}

/**
 * Gets the steps that take the canvas down to an item. Each dissolved
 * container between the canvas and the item adds the steps that position it
 * in its parent, and the item adds its own. When any of them can't be told
 * from attributes, or the result is not where the item was on screen, the
 * item is placed where it was measured.
 *
 * @param item     The item.
 * @param root     The block that becomes the canvas.
 * @param geometry Measurements.
 * @return The steps.
 */
export function getHorizontalSteps(
	item: CanvasItem,
	root: CanvasBlock,
	geometry: HorizontalGeometry
): HorizontalStep[] {
	const { rects, width, gap } = geometry;
	const rect = getItemRect( item, rects );
	const measuredStep: HorizontalStep = {
		type: 'measured',
		start: rect.left / ( width + gap ),
		end: ( rect.right + gap ) / ( width + gap ),
	};
	const parents = [ root, ...item.ancestors ];

	const steps: HorizontalStep[] = [];
	for ( let index = 0; index < item.ancestors.length; index++ ) {
		const ancestorSteps = getStepsInParent(
			item.ancestors[ index ],
			parents[ index ],
			geometry,
			index === 0
		);
		if ( ! ancestorSteps ) {
			return [ measuredStep ];
		}
		steps.push( ...ancestorSteps );
	}

	const parent = parents[ parents.length - 1 ];
	const isRoot = parents.length === 1;
	let itemSteps;
	if ( item.column ) {
		itemSteps = getStepsInParent( item.column, parent, geometry, isRoot );
	} else {
		const memberSteps = item.blocks.map( ( block ) =>
			getStepsInParent( block, parent, geometry, isRoot )
		);
		// A run of text is only positioned by its parent when all of its
		// blocks are positioned the same way.
		const [ first ] = memberSteps;
		itemSteps =
			first &&
			memberSteps.every(
				( memberStep ) =>
					memberStep && areStepsEqual( memberStep, first )
			)
				? first
				: undefined;
	}
	if ( ! itemSteps ) {
		return [ measuredStep ];
	}
	steps.push( ...itemSteps );

	// Theme CSS can put a block somewhere its attributes don't say.
	const [ start, end ] = steps.reduce( applyStep, [ 0, 1 ] );
	const scale = width + gap;
	const maxError = Math.max( MAX_STEP_ERROR, gap );
	if (
		Math.abs( start - measuredStep.start ) * scale > maxError ||
		Math.abs( end - measuredStep.end ) * scale > maxError
	) {
		return [ measuredStep ];
	}
	return steps;
}
