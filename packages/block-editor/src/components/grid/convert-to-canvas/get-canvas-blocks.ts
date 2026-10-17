import { cloneBlock, createBlock, hasBlockSupport } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import type { CanvasBlock, CanvasItem, Place, Rows } from './types';

// Blocks whose size attributes fight the cell they fill.
const SIZED_BLOCKS = [ 'core/image', 'core/post-featured-image' ];

const VIEWPORTS = [ '@tablet', '@mobile' ];

type Style = Record< string, any >;

/**
 * Gets a block's style for a canvas: margins are cleared, as the grid places
 * the block, and its layout is the place it gets, replacing whatever layout
 * it had in its previous parent, for every viewport.
 *
 * @param style        The block's style.
 * @param layout       The block's place in the canvas.
 * @param tabletLayout The block's rows on tablets, when they differ.
 * @return The style.
 */
export function getItemStyle(
	style: Style = {},
	layout?: Place[ 'layout' ],
	tabletLayout?: Rows
): Style {
	const next: Style = { ...style };
	if ( next.spacing?.margin ) {
		const { margin, ...spacing } = next.spacing;
		next.spacing = Object.keys( spacing ).length ? spacing : undefined;
	}
	for ( const viewport of VIEWPORTS ) {
		if ( next[ viewport ]?.layout ) {
			const { layout: viewportLayout, ...viewportStyle } =
				next[ viewport ];
			next[ viewport ] = Object.keys( viewportStyle ).length
				? viewportStyle
				: undefined;
		}
	}
	if ( tabletLayout ) {
		next[ '@tablet' ] = { ...next[ '@tablet' ], layout: tabletLayout };
	}
	next.layout = layout;
	return Object.fromEntries(
		Object.entries( next ).filter( ( [ , value ] ) => value !== undefined )
	);
}

/**
 * Gets the attributes a block changes to when it becomes an item of a canvas,
 * or a block in one of its Stacks.
 *
 * @param block        The block.
 * @param layout       The block's place in the canvas.
 * @param tabletLayout The block's rows on tablets.
 * @return The attributes.
 */
function getItemAttributes(
	block: CanvasBlock,
	layout?: Place[ 'layout' ],
	tabletLayout?: Rows
) {
	// `cloneBlock` merges attributes, so cleared ones are set to `undefined`.
	const attributes: Record< string, unknown > = {
		style: getItemStyle( block.attributes.style, layout, tabletLayout ),
	};
	// An aligned block gets a wrapper in the editor, which becomes the grid
	// item and ignores the block's place.
	if ( hasBlockSupport( block.name, 'align' ) ) {
		attributes.align = undefined;
	}
	// The cell decides the shape of a block that fills it.
	if ( SIZED_BLOCKS.includes( block.name ) ) {
		attributes.width = undefined;
		attributes.height = undefined;
		attributes.aspectRatio = undefined;
	}
	return attributes;
}

function cloneMember( block: CanvasBlock ) {
	// The blocks come from the block editor's store.
	return cloneBlock( block as Block, getItemAttributes( block ) );
}

/**
 * Makes the blocks of a canvas from its items and their places, in document
 * order.
 *
 * A run of text becomes a vertical Stack that stretches its blocks. A Column,
 * which can only live in Columns, becomes a Stack with the same look and
 * vertical alignment.
 *
 * @param items             The items.
 * @param places            Each item's place.
 * @param groupingBlockName Name of the block that groups blocks.
 * @return The blocks.
 */
export function getCanvasBlocks(
	items: CanvasItem[],
	places: Place[],
	groupingBlockName: string
): Block[] {
	return items.map( ( item, index ) => {
		const { layout, tabletLayout } = places[ index ];
		const [ block ] = item.blocks;
		const column =
			item.column ?? ( block.name === 'core/column' ? block : undefined );
		if ( item.type === 'block' && ! column ) {
			return cloneBlock(
				block as Block,
				getItemAttributes( block, layout, tabletLayout )
			);
		}
		const members =
			item.type === 'stack' || ! column
				? item.blocks
				: column.innerBlocks;
		// The grouping block keeps the Column's look; attributes it doesn't
		// have, such as the Column's width, are dropped by `createBlock`.
		const columnAttributes = column?.attributes ?? {};
		return createBlock(
			groupingBlockName,
			{
				...columnAttributes,
				style: getItemStyle(
					columnAttributes.style,
					layout,
					tabletLayout
				),
				layout: {
					type: 'flex',
					orientation: 'vertical',
					justifyContent: 'stretch',
					...( item.verticalAlignment && {
						verticalAlignment: item.verticalAlignment,
					} ),
				},
			},
			members.map( cloneMember )
		);
	} );
}
