import {
	createBlock,
	getBlockSupport,
	hasBlockSupport,
	isReusableBlock,
	isTemplatePart,
	store as blocksStore,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { useRegistry, useSelect } from '@wordpress/data';
import type { select as registrySelect } from '@wordpress/data';
import { useCallback, useContext } from '@wordpress/element';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { BlockRefs } from '../../provider/block-refs-provider';
import { getCanvasItems } from './get-canvas-items';
import { getHorizontalSteps, getItemRect } from './get-horizontal-fractions';
import {
	chooseColumnCount,
	getTrackHeight,
	placeRows,
	placeTabletRows,
	resolveColumns,
} from './get-canvas-placement';
import { measureCanvas, measureContentHeight } from './measure-canvas-items';
import { getCanvasBlocks } from './get-canvas-blocks';
import type { CanvasBlock, CanvasItem, GetElement, Place } from './types';

const { getViewportBreakpoints, getViewportBreakpointValueInPixels } = unlock(
	globalStylesEnginePrivateApis
);

type Select = typeof registrySelect;

/**
 * A canvas worked out from a container, ready to be applied.
 */
export interface Canvas {
	items: CanvasItem[];
	places: Place[];
	columnCount: number;
	rowCount: number;
	/** The row count on tablets, when tablets get rows of their own. */
	tabletRowCount?: number;
	/**
	 * Whether the container had the root padding at its sides, which it
	 * keeps.
	 */
	hasGlobalPadding: boolean;
}

/**
 * Finds a block's element in the editor canvas, for callers outside the block
 * editor's provider, such as commands, which get no block refs.
 *
 * @param clientId The block's client ID.
 * @return The element.
 */
function findBlockElement( clientId: string ) {
	const documents = [
		document,
		...Array.from(
			document.querySelectorAll< HTMLIFrameElement >(
				'iframe[name="editor-canvas"]'
			),
			( iframe ) => iframe.contentDocument
		),
	];
	for ( const ownerDocument of documents ) {
		const element = ownerDocument?.querySelector< HTMLElement >(
			`.block-editor-block-list__block[data-block="${ clientId }"]`
		);
		if ( element ) {
			return element;
		}
	}
	return undefined;
}

function isManualGrid( layout?: {
	type?: string;
	isManualPlacement?: boolean;
} ) {
	return layout?.type === 'grid' && !! layout?.isManualPlacement;
}

/**
 * Checks whether a block can be converted to a canvas: a container with
 * blocks in it whose layout can become a manual grid, or Columns, which
 * become a Group. Blocks in a canvas can't be converted, since their cell
 * has a fixed size. An unsynced pattern is detached by the conversion; other
 * content-only or locked content can't be converted.
 *
 * @param select   The data registry's `select`.
 * @param clientId The block's client ID.
 * @return Whether the block can be converted.
 */
export function canConvertToCanvas(
	select: Select,
	clientId: string | undefined
): boolean {
	if ( ! window.__experimentalEnableGridInteractivity || ! clientId ) {
		return false;
	}
	const {
		getBlock,
		getBlockParents,
		getBlockAttributes,
		getBlockRootClientId,
		getBlockEditingMode,
		getParentSectionBlock,
		getTemplateLock,
		canEditBlock,
		canInsertBlockType,
	} = unlock( select( blockEditorStore ) );
	const block: CanvasBlock | null = getBlock( clientId );
	if ( ! block?.innerBlocks.length ) {
		return false;
	}
	if (
		isTemplatePart( block as Block ) ||
		isReusableBlock( block as Block )
	) {
		return false;
	}
	if ( block.name === 'core/columns' ) {
		const groupingBlockName = select( blocksStore ).getGroupingBlockName();
		if (
			! groupingBlockName ||
			! canInsertBlockType(
				groupingBlockName,
				getBlockRootClientId( clientId )
			)
		) {
			return false;
		}
	} else {
		const layoutSupport = getBlockSupport( block.name, 'layout' ) as
			{ allowSwitching?: boolean; allowEditing?: boolean } | undefined;
		if (
			! hasBlockSupport( block.name, 'layout' ) ||
			layoutSupport?.allowSwitching === false ||
			layoutSupport?.allowEditing === false ||
			isManualGrid( block.attributes.layout )
		) {
			return false;
		}
	}
	if (
		getBlockParents( clientId ).some( ( parentId: string ) =>
			isManualGrid( getBlockAttributes( parentId )?.layout )
		)
	) {
		return false;
	}
	const isUnsyncedPattern = !! block.attributes.metadata?.patternName;
	return (
		canEditBlock( clientId ) &&
		! getTemplateLock( clientId ) &&
		! getParentSectionBlock( clientId ) &&
		( isUnsyncedPattern ||
			getBlockEditingMode( clientId ) === 'default' ) &&
		block.innerBlocks.every(
			( innerBlock ) => ! innerBlock.attributes.lock?.remove
		)
	);
}

/**
 * Checks whether a block can be converted to a canvas.
 *
 * @param clientId The block's client ID.
 * @return Whether the block can be converted.
 */
export function useCanConvertToCanvas( clientId: string | undefined ) {
	return useSelect(
		( select ) => canConvertToCanvas( select, clientId ),
		[ clientId ]
	);
}

function getSpanWidth(
	span: number,
	columnCount: number,
	width: number,
	columnGap: number
) {
	const track = ( width - ( columnCount - 1 ) * columnGap ) / columnCount;
	return span * track + ( span - 1 ) * columnGap;
}

/**
 * Works out the canvas a container becomes: its column and row count, and
 * the blocks it holds with their places, measured from where the container's
 * blocks are on screen.
 *
 * @param root             The block that becomes the canvas.
 * @param getElement       Gets a block's element.
 * @param viewportSettings The theme's viewport breakpoints.
 * @return The canvas, or `undefined` when its blocks can't be measured.
 */
export function getCanvas(
	root: CanvasBlock,
	getElement: GetElement,
	viewportSettings?: unknown
): Canvas | undefined {
	const items = getCanvasItems( root );
	if ( ! items.length ) {
		return undefined;
	}
	const geometry = measureCanvas( { root, getElement } );
	if ( ! geometry ) {
		return undefined;
	}
	const { container, rects, width, columnGap, rowGap } = geometry;

	// Columns come from attributes where they are exact, and from where the
	// blocks are otherwise.
	const itemSteps = items.map( ( item ) =>
		getHorizontalSteps( item, root, {
			rects,
			insets: geometry.insets,
			width,
			gap: columnGap,
		} )
	);
	const columnCount = chooseColumnCount( itemSteps, {
		width,
		gap: columnGap,
	} );
	const pitch = ( width + columnGap ) / columnCount;
	const columns = itemSteps.map( ( steps ) =>
		resolveColumns( steps, columnCount, pitch )
	);

	// Rows come from where the blocks are, made tall enough for their content
	// at the width of their columns.
	const boxes = items.map( ( item, index ) => {
		const rect = getItemRect( item, rects );
		const { columnStart, columnEnd } = columns[ index ];
		const height = measureContentHeight(
			item,
			getSpanWidth(
				columnEnd - columnStart + 1,
				columnCount,
				width,
				columnGap
			),
			container,
			getElement
		);
		return {
			...rect,
			bottom: Math.max( rect.bottom, rect.top + ( height ?? 0 ) ),
			columnStart,
			columnEnd,
		};
	} );
	const desktop = {
		columnCount,
		width,
		borderWidth: geometry.borderWidth,
		blockInset: geometry.blockInset,
		isBorderBox: geometry.isBorderBox,
		rowGap,
	};
	const { rows, rowCount } = placeRows( boxes, {
		trackHeight: ( count ) => getTrackHeight( count, desktop ),
		rowGap,
	} );

	const places: Place[] = items.map( ( item, index ) => ( {
		layout: {
			columnStart: columns[ index ].columnStart,
			rowStart: rows[ index ].rowStart,
			columnSpan:
				columns[ index ].columnEnd - columns[ index ].columnStart + 1,
			rowSpan: rows[ index ].rowSpan,
		},
	} ) );

	// Cells shrink with the canvas and text doesn't, so tablets get rows of
	// their own, measured at the tablet breakpoint, where the tablet preview
	// shows them.
	let tabletRowCount;
	const { tablet: tabletBreakpoint } =
		getViewportBreakpoints( viewportSettings );
	if ( tabletBreakpoint ) {
		const tabletBorderWidth = Math.min(
			geometry.borderWidth,
			getViewportBreakpointValueInPixels( tabletBreakpoint ) -
				geometry.gutter
		);
		const tablet = {
			...desktop,
			borderWidth: tabletBorderWidth,
			width: tabletBorderWidth - geometry.inlineInset,
		};
		const tabletRows = placeTabletRows(
			items.map( ( item, index ) => ( {
				...places[ index ].layout,
				columnEnd: columns[ index ].columnEnd,
				height: measureContentHeight(
					item,
					getSpanWidth(
						places[ index ].layout.columnSpan,
						columnCount,
						tablet.width,
						columnGap
					),
					container,
					getElement
				),
			} ) ),
			{
				trackHeight: ( count ) => getTrackHeight( count, tablet ),
				rowGap,
				rowCount,
			}
		);
		const isChanged = ( index: number ) =>
			tabletRows.rows[ index ].rowStart !==
				places[ index ].layout.rowStart ||
			tabletRows.rows[ index ].rowSpan !== places[ index ].layout.rowSpan;
		if (
			tabletRows.rowCount !== rowCount ||
			places.some( ( place, index ) => isChanged( index ) )
		) {
			tabletRowCount = tabletRows.rowCount;
			places.forEach( ( place, index ) => {
				if ( isChanged( index ) ) {
					place.tabletLayout = tabletRows.rows[ index ];
				}
			} );
		}
	}

	return {
		items,
		places,
		columnCount,
		rowCount,
		tabletRowCount,
		hasGlobalPadding: geometry.hasGlobalPadding,
	};
}

/**
 * Gets the attributes of the block that becomes the canvas.
 *
 * @param root   The block.
 * @param canvas The canvas.
 * @param extra  Attributes to set as well, such as a variation's.
 * @return The attributes.
 */
function getCanvasAttributes(
	root: CanvasBlock,
	canvas: Canvas,
	extra: Record< string, any > = {}
) {
	const { columnCount, rowCount, tabletRowCount, hasGlobalPadding } = canvas;
	const style = { ...root.attributes.style, ...extra.style };
	// The canvas gets the theme's gap for grids, which it was measured with.
	const { blockGap, ...spacing } = style.spacing ?? {};
	// The root padding at the sides only comes with a constrained layout, so
	// the canvas sets it itself.
	if ( hasGlobalPadding ) {
		spacing.padding = {
			left: 'var(--wp--style--root--padding-left)',
			right: 'var(--wp--style--root--padding-right)',
			...spacing.padding,
		};
	}
	style.spacing = spacing;
	if ( ! Object.keys( style.spacing ).length ) {
		delete style.spacing;
	}
	if ( tabletRowCount ) {
		style[ '@tablet' ] = {
			...style[ '@tablet' ],
			layout: { ...style[ '@tablet' ]?.layout, rowCount: tabletRowCount },
		};
	}
	const attributes: Record< string, unknown > = {
		...extra,
		layout: {
			type: 'grid',
			columnCount,
			rowCount,
			isManualPlacement: true,
		},
		style,
	};
	// Converting a pattern's section detaches it from the pattern.
	if ( root.attributes.metadata?.patternName ) {
		const { patternName, ...metadata } = root.attributes.metadata;
		attributes.metadata = metadata;
	}
	return attributes;
}

/**
 * Returns a function that converts a container to a canvas, a manual
 * placement grid, keeping where its blocks are on screen, in one undo step.
 * The canvas is selected afterwards.
 *
 * @return Converts a block, optionally setting more attributes on it, and returns whether it did.
 */
export function useConvertToCanvas() {
	const registry = useRegistry();
	const { refsMap } = useContext( BlockRefs );
	return useCallback(
		(
			clientId: string,
			{ attributes }: { attributes?: Record< string, any > } = {}
		): boolean => {
			const { getBlock, getSettings } =
				registry.select( blockEditorStore );
			const {
				replaceBlocks,
				replaceInnerBlocks,
				updateBlockAttributes,
				selectBlock,
			} = registry.dispatch( blockEditorStore );
			const root: CanvasBlock | null = getBlock( clientId );
			const groupingBlockName = registry
				.select( blocksStore )
				.getGroupingBlockName();
			if ( ! root || ! groupingBlockName ) {
				return false;
			}
			const canvas = getCanvas(
				root,
				( id ) =>
					( refsMap.get( id ) as HTMLElement | null ) ??
					findBlockElement( id ),
				(
					getSettings().__experimentalFeatures as
						{ viewport?: unknown } | undefined
				 )?.viewport
			);
			if ( ! canvas ) {
				return false;
			}
			const blocks = getCanvasBlocks(
				canvas.items,
				canvas.places,
				groupingBlockName
			);
			const canvasAttributes = getCanvasAttributes(
				root,
				canvas,
				attributes
			);

			registry.batch( () => {
				if ( root.name === 'core/columns' ) {
					const group = createBlock(
						groupingBlockName,
						{ ...root.attributes, ...canvasAttributes },
						blocks
					);
					replaceBlocks( clientId, group );
					selectBlock( group.clientId );
					return;
				}
				replaceInnerBlocks( clientId, blocks );
				updateBlockAttributes( clientId, canvasAttributes );
				selectBlock( clientId );
			} );
			return true;
		},
		[ registry, refsMap ]
	);
}
