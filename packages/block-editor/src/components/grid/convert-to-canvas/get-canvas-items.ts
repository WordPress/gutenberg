import type { CanvasBlock, CanvasItem } from './types';

/**
 * Blocks that hold a run of text. Consecutive text blocks stay together as
 * one Stack in the canvas, so that they keep their rhythm: square cells are
 * about as tall as a heading, so placing each one on its own row would spread
 * them out.
 */
export const TEXT_BLOCKS = [
	'core/heading',
	'core/paragraph',
	'core/buttons',
	'core/list',
	'core/quote',
	'core/pullquote',
	'core/verse',
	'core/preformatted',
	'core/code',
	'core/details',
];

// Containers that only lay out their children. They are dissolved, and their
// children are placed on the canvas, unless they have a look of their own.
const LAYOUT_CONTAINERS = [ 'core/columns', 'core/column', 'core/group' ];

const DROPPED_BLOCKS = [ 'core/spacer' ];

/**
 * Checks whether a block looks like something on its own: a background,
 * border, shadow, block style or custom class. Such a container is kept as
 * one item, because dissolving it would lose its look.
 *
 * @param block A block.
 * @return Whether the block has a look of its own.
 */
export function hasOwnLook( block: CanvasBlock ): boolean {
	const {
		style = {},
		className,
		backgroundColor,
		gradient,
		borderColor,
	} = block.attributes ?? {};
	return !! (
		style.color?.background ||
		style.color?.gradient ||
		style.background ||
		style.border ||
		style.shadow ||
		backgroundColor ||
		gradient ||
		borderColor ||
		className
	);
}

function isTextBlock( block: CanvasBlock ) {
	return TEXT_BLOCKS.includes( block.name );
}

function isTextRun( blocks: CanvasBlock[] ) {
	return blocks.length > 0 && blocks.every( isTextBlock );
}

/**
 * Checks whether a container only lays out its children, so that they can be
 * placed on the canvas directly. Columns always are. Columns and Groups are,
 * unless they have a look of their own; a Group in grid layout is kept, since
 * its own grid places its children.
 *
 * @param block A block.
 * @return Whether the block is dissolved.
 */
function isDissolvable( block: CanvasBlock ) {
	if ( ! LAYOUT_CONTAINERS.includes( block.name ) ) {
		return false;
	}
	if ( block.name === 'core/columns' ) {
		return true;
	}
	if ( hasOwnLook( block ) || block.attributes?.layout?.type === 'grid' ) {
		return false;
	}
	return block.innerBlocks.length > 0;
}

/**
 * Gets the blocks that become the canvas's items, in document order, so that
 * the stack shown on mobile reads as before.
 *
 * Containers that only lay out their children are dissolved, and their
 * children become items. A run of text blocks becomes one Stack item. A
 * Column holding only text becomes that Stack, as a Column can only live in
 * Columns. A Group holding only text stays as it is. Spacers are dropped:
 * the space they made becomes empty cells.
 *
 * @param root The block that becomes the canvas.
 * @return The items.
 */
export function getCanvasItems( root: CanvasBlock ): CanvasItem[] {
	const items: CanvasItem[] = [];

	function addChildren( blocks: CanvasBlock[], ancestors: CanvasBlock[] ) {
		let run: CanvasBlock[] = [];
		const endRun = () => {
			if ( run.length ) {
				items.push( {
					type: run.length > 1 ? 'stack' : 'block',
					blocks: run,
					ancestors,
				} );
			}
			run = [];
		};
		for ( const block of blocks ) {
			if ( isTextBlock( block ) ) {
				run.push( block );
				continue;
			}
			endRun();
			addBlock( block, ancestors );
		}
		endRun();
	}

	function addBlock( block: CanvasBlock, ancestors: CanvasBlock[] ) {
		if ( DROPPED_BLOCKS.includes( block.name ) ) {
			return;
		}
		const parent = ancestors[ ancestors.length - 1 ] ?? root;
		const verticalAlignment: string | undefined =
			block.name === 'core/column'
				? ( block.attributes?.verticalAlignment ??
					parent.attributes?.verticalAlignment )
				: undefined;
		const textRun =
			block.name !== 'core/columns' && isTextRun( block.innerBlocks );
		if ( block.name === 'core/column' && textRun ) {
			items.push( {
				type: 'stack',
				blocks: block.innerBlocks,
				column: block,
				ancestors,
				verticalAlignment,
			} );
			return;
		}
		if ( isDissolvable( block ) && ! textRun ) {
			addChildren( block.innerBlocks, [ ...ancestors, block ] );
			return;
		}
		items.push( {
			type: 'block',
			blocks: [ block ],
			ancestors,
			...( verticalAlignment && { verticalAlignment } ),
		} );
	}

	if ( root.name === 'core/columns' ) {
		for ( const column of root.innerBlocks ) {
			addBlock( column, [] );
		}
	} else {
		addChildren( root.innerBlocks, [] );
	}
	return items;
}
