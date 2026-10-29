import type { CanvasBlock, CanvasItem, GetElement, Rect } from './types';

/**
 * Blocks that fill their cell in a canvas, so their content never needs more
 * rows than their cell has.
 */
export const FILL_BLOCKS = [
	'core/image',
	'core/cover',
	'core/video',
	'core/media-text',
	'core/post-featured-image',
];

// Keeps an element out of view and out of the layout while it is measured.
const MEASURING_STYLE: Partial< CSSStyleDeclaration > = {
	position: 'absolute',
	visibility: 'hidden',
	pointerEvents: 'none',
	left: '0',
	top: '0',
	height: 'auto',
	minHeight: '0',
	maxWidth: 'none',
	margin: '0',
	boxSizing: 'border-box',
};

/**
 * Where a container's blocks are on screen, and the geometry of the canvas it
 * becomes.
 */
export interface CanvasGeometry {
	/** The element that becomes the grid. */
	container: HTMLElement;
	/** Rectangles by client ID, relative to the container's content box. */
	rects: Map< string, Rect >;
	/** Client IDs of containers with horizontal padding or borders. */
	insets: Set< string >;
	/** Width of the container's content box. */
	width: number;
	/** Width of the container's border box. */
	borderWidth: number;
	/** Horizontal padding and borders, together. */
	inlineInset: number;
	/** Vertical padding and borders, together. */
	blockInset: number;
	/** Whether the container uses `box-sizing: border-box`. */
	isBorderBox: boolean;
	/** Space the container keeps at the sides of narrower screens. */
	gutter: number;
	/**
	 * Whether the container gets the root padding at its sides, which only
	 * constrained layouts get.
	 */
	hasGlobalPadding: boolean;
	/** The grid's row gap. */
	rowGap: number;
	/** The grid's column gap. */
	columnGap: number;
}

function toPixels( value: string ) {
	const number = parseFloat( value );
	return Number.isFinite( number ) ? number : 0;
}

function getInsets( element: HTMLElement ) {
	const style =
		element.ownerDocument.defaultView!.getComputedStyle( element );
	const side = ( name: 'Left' | 'Right' | 'Top' | 'Bottom' ) =>
		toPixels(
			style.getPropertyValue( `padding-${ name.toLowerCase() }` )
		) +
		toPixels(
			style.getPropertyValue( `border-${ name.toLowerCase() }-width` )
		);
	return {
		left: side( 'Left' ),
		right: side( 'Right' ),
		top: side( 'Top' ),
		bottom: side( 'Bottom' ),
		isBorderBox: style.boxSizing === 'border-box',
	};
}

// A copy of a block's element that can't be mistaken for the block.
function cloneBlockElement( element: HTMLElement ) {
	const clone = element.cloneNode( true ) as HTMLElement;
	clone.removeAttribute( 'id' );
	clone.removeAttribute( 'data-block' );
	return clone;
}

// The canvas gets the theme's gap for grids, like a new Canvas. A gap of
// dissolved Columns sits between two columns only, and repeated between every
// column of the canvas it would leave no room for them.
function measureGaps( container: HTMLElement ) {
	const { ownerDocument } = container;
	const probe = ownerDocument.createElement( 'div' );
	probe.className = 'is-layout-grid';
	Object.assign( probe.style, MEASURING_STYLE );
	container.appendChild( probe );
	const style = ownerDocument.defaultView!.getComputedStyle( probe );
	const gaps = {
		rowGap: toPixels( style.rowGap ),
		columnGap: toPixels( style.columnGap ),
	};
	probe.remove();
	return gaps;
}

/**
 * Measures where a container's blocks are on screen, and the geometry of the
 * canvas it becomes.
 *
 * @param options
 * @param options.root       The block that becomes the canvas.
 * @param options.getElement Gets a block's element.
 * @return The measurements, or `undefined` when a block is not on screen.
 */
export function measureCanvas( {
	root,
	getElement,
}: {
	root: CanvasBlock;
	getElement: GetElement;
} ): CanvasGeometry | undefined {
	const firstChildElement = root.innerBlocks[ 0 ]
		? getElement( root.innerBlocks[ 0 ].clientId )
		: undefined;
	// The element that holds the inner blocks becomes the grid. It is the
	// block's own element for a Group, but not for every block.
	const container = firstChildElement?.parentElement;
	if ( ! container ) {
		return undefined;
	}
	const containerRect = container.getBoundingClientRect();
	const insets = getInsets( container );
	const originX = containerRect.left + insets.left;
	const originY = containerRect.top + insets.top;

	const rects = new Map< string, Rect >();
	const paddedContainers = new Set< string >();
	let isComplete = true;
	const measure = ( block: CanvasBlock ) => {
		const element = getElement( block.clientId );
		if ( ! element ) {
			isComplete = false;
			return;
		}
		const rect = element.getBoundingClientRect();
		rects.set( block.clientId, {
			left: rect.left - originX,
			top: rect.top - originY,
			right: rect.right - originX,
			bottom: rect.bottom - originY,
		} );
		if ( block.innerBlocks.length ) {
			const { left, right } = getInsets( element );
			if ( left + right > 0.5 ) {
				paddedContainers.add( block.clientId );
			}
			block.innerBlocks.forEach( measure );
		}
	};
	root.innerBlocks.forEach( measure );
	if ( ! isComplete ) {
		return undefined;
	}

	const { ownerDocument } = container;
	const documentWidth = ownerDocument.documentElement.clientWidth;
	const rootContainer = ownerDocument.querySelector< HTMLElement >(
		'.is-root-container.has-global-padding'
	);
	const rootInsets = rootContainer ? getInsets( rootContainer ) : undefined;
	const rootPadding = rootInsets ? rootInsets.left + rootInsets.right : 0;

	return {
		container,
		rects,
		insets: paddedContainers,
		width: containerRect.width - insets.left - insets.right,
		borderWidth: containerRect.width,
		inlineInset: insets.left + insets.right,
		blockInset: insets.top + insets.bottom,
		isBorderBox: insets.isBorderBox,
		// Space at the sides of the screen that the canvas keeps at narrower
		// widths: the root padding, unless the canvas is full width.
		gutter: Math.max(
			0,
			Math.min( documentWidth - containerRect.width, rootPadding )
		),
		hasGlobalPadding: container.classList.contains( 'has-global-padding' ),
		...measureGaps( container ),
	};
}

/**
 * Measures the height an item's content needs at a width, by laying out a
 * copy of it out of view. A run of text is laid out as the Stack it becomes.
 *
 * @param item       The item.
 * @param width      The width.
 * @param container  The canvas's element.
 * @param getElement Gets a block's element.
 * @return The height, or `undefined` for an item that fills its cell.
 */
export function measureContentHeight(
	item: CanvasItem,
	width: number,
	container: HTMLElement,
	getElement: GetElement
): number | undefined {
	const [ firstBlock ] = item.blocks;
	if ( item.type === 'block' && FILL_BLOCKS.includes( firstBlock.name ) ) {
		return undefined;
	}
	let element: HTMLElement;
	if ( item.type === 'block' ) {
		const blockElement = getElement( firstBlock.clientId );
		if ( ! blockElement ) {
			return undefined;
		}
		element = cloneBlockElement( blockElement );
	} else {
		// A vertical Stack that stretches its blocks, as `getCanvasBlocks`
		// makes it, with the theme's gap for flex layouts.
		element = container.ownerDocument.createElement( 'div' );
		element.className = 'is-layout-flex';
		for ( const block of item.blocks ) {
			const blockElement = getElement( block.clientId );
			if ( blockElement ) {
				element.appendChild( cloneBlockElement( blockElement ) );
			}
		}
		Object.assign( element.style, {
			display: 'flex',
			flexDirection: 'column',
			flexWrap: 'nowrap',
			alignItems: 'stretch',
		} );
	}
	Object.assign( element.style, MEASURING_STYLE, { width: `${ width }px` } );
	container.appendChild( element );
	const { height } = element.getBoundingClientRect();
	element.remove();
	return height;
}
