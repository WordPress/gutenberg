import {
	useCallback,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	chevronDown,
	chevronLeft,
	chevronRight,
	chevronUp,
} from '@wordpress/icons';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { BlockRefs } from '../provider/block-refs-provider';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getStyleForState } from '../../hooks/block-style-state';
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child';
import { isPlainObject } from '../../utils/object';
import { GridItemMover } from './grid-item-movers';
import { getGridTracks, getRectInGrid, getTrackRange, GridRect } from './utils';
import type { ChildLayoutBlockStyle, BlockStyleState } from '../../hooks/types';

type Direction = 'left' | 'right' | 'up' | 'down';

interface GridItem {
	clientId: string;
	rect: GridRect;
	isExplicit: boolean;
}

interface GridSnapshot {
	columnCount: number;
	items: GridItem[];
}

const DIRECTION_OFFSETS: Record< Direction, [ number, number ] > = {
	left: [ -1, 0 ],
	right: [ 1, 0 ],
	up: [ 0, -1 ],
	down: [ 0, 1 ],
};

/**
 * Reads where each child of an auto grid is rendered, as column and row
 * ranges, and whether it has an explicit position.
 *
 * @param gridElement The grid element.
 * @param blockOrder  The client IDs of the grid's children.
 * @param blockStyles The style attributes of the children, by client ID.
 * @param getElement  Gets the element of a block by client ID.
 * @param styleState  The style state the explicit positions are read from.
 *
 * @return The grid's column count and items, or undefined if the grid can't
 *         be measured.
 */
function getGridSnapshot(
	gridElement: HTMLElement,
	blockOrder: string[],
	blockStyles: Record< string, unknown >,
	getElement: ( clientId: string ) => Element | null | undefined,
	styleState: BlockStyleState
): GridSnapshot | undefined {
	if ( ! gridElement.offsetWidth || ! gridElement.offsetHeight ) {
		return undefined;
	}
	const columns = getGridTracks( gridElement, 'column' );
	const rows = getGridTracks( gridElement, 'row' );
	// Tracks are not measurable in pixels, for example when not a grid.
	if (
		[ ...columns, ...rows ].some( ( { end } ) => ! Number.isFinite( end ) )
	) {
		return undefined;
	}

	const items: GridItem[] = [];
	for ( const clientId of blockOrder ) {
		const element = getElement( clientId );
		if (
			! element ||
			element.parentElement !== gridElement ||
			! element.getClientRects().length
		) {
			continue;
		}
		const bounds = getRectInGrid( gridElement, element );
		if ( ! bounds ) {
			continue;
		}
		const columnRange = getTrackRange( columns, bounds.left, bounds.right );
		const rowRange = getTrackRange( rows, bounds.top, bounds.bottom );
		if ( ! columnRange || ! rowRange ) {
			continue;
		}

		const rawStyle = blockStyles[ clientId ];
		const style = isPlainObject( rawStyle )
			? ( rawStyle as ChildLayoutBlockStyle )
			: undefined;
		const viewportStyle = getStyleForState( style, {
			viewport: styleState.viewport,
			pseudo: 'default',
		} ) as ChildLayoutBlockStyle | undefined;
		const layout = { ...style?.layout, ...viewportStyle?.layout };
		items.push( {
			clientId,
			rect: new GridRect( {
				columnStart: columnRange[ 0 ],
				columnEnd: columnRange[ 1 ],
				rowStart: rowRange[ 0 ],
				rowEnd: rowRange[ 1 ],
			} ),
			// An unset start can be undefined or null, and neither is explicit.
			isExplicit:
				( layout.columnStart ?? null ) !== null ||
				( layout.rowStart ?? null ) !== null,
		} );
	}
	return { columnCount: columns.length, items };
}

/**
 * Directional movers for a child of an auto grid. Each move reorders the block
 * if it can be auto-placed to that position, and otherwise pins it to the target cell
 * with an explicit column and row start.
 *
 * @param props
 * @param props.blockClientId The client ID of the child block.
 * @param props.gridClientId  The client ID of the grid block.
 */
export default function AutoGridItemMovers( {
	blockClientId,
	gridClientId,
}: {
	blockClientId: string;
	gridClientId: string;
} ) {
	const { refsMap } = useContext( BlockRefs );
	const blockElement = useBlockElement( blockClientId );
	const { blockOrder, blockStyles, styleState } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockStyles,
				getSelectedBlockStyleState,
			} = unlock( select( blockEditorStore ) );
			const order: string[] = getBlockOrder( gridClientId );
			return {
				blockOrder: order,
				blockStyles: getBlockStyles( order ),
				styleState: getSelectedBlockStyleState( blockClientId ),
			};
		},
		[ blockClientId, gridClientId ]
	);
	const { moveBlocksToPosition, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const [ snapshot, setSnapshot ] = useState< GridSnapshot >();

	const readSnapshot = useCallback( () => {
		const gridElement = blockElement?.parentElement;
		if ( ! gridElement ) {
			return undefined;
		}
		return getGridSnapshot(
			gridElement,
			blockOrder,
			blockStyles,
			( clientId ) => refsMap.get( clientId ),
			styleState
		);
	}, [ blockElement, blockOrder, blockStyles, refsMap, styleState ] );

	useEffect( () => {
		const gridElement = blockElement?.parentElement;
		if ( ! gridElement ) {
			setSnapshot( undefined );
			return;
		}
		const update = () => setSnapshot( readSnapshot() );
		update();
		const observer = new ResizeObserver( update );
		observer.observe( gridElement );
		for ( const clientId of blockOrder ) {
			const element = refsMap.get( clientId );
			if ( element ) {
				observer.observe( element );
			}
		}
		return () => observer.disconnect();
	}, [ blockElement, blockOrder, refsMap, readSnapshot ] );

	const selected = snapshot?.items.find(
		( item ) => item.clientId === blockClientId
	);

	function move( direction: Direction ) {
		const current = readSnapshot();
		const item = current?.items.find(
			( candidate ) => candidate.clientId === blockClientId
		);
		if ( ! current || ! item ) {
			return;
		}
		const [ columnOffset, rowOffset ] = DIRECTION_OFFSETS[ direction ];
		const target = new GridRect( {
			columnStart: item.rect.columnStart + columnOffset,
			columnEnd: item.rect.columnEnd + columnOffset,
			rowStart: item.rect.rowStart + rowOffset,
			rowEnd: item.rect.rowEnd + rowOffset,
		} );
		if (
			target.columnStart < 1 ||
			target.columnEnd > current.columnCount ||
			target.rowStart < 1
		) {
			return;
		}

		const nearby = new GridRect( {
			columnStart: Math.max(
				1,
				Math.min( item.rect.columnStart, target.columnStart ) - 1
			),
			columnEnd: Math.max( item.rect.columnEnd, target.columnEnd ) + 1,
			rowStart: Math.max(
				1,
				Math.min( item.rect.rowStart, target.rowStart ) - 1
			),
			rowEnd: Math.max( item.rect.rowEnd, target.rowEnd ) + 1,
		} );
		const otherItems = current.items.filter(
			( candidate ) => candidate.clientId !== blockClientId
		);
		const targets = otherItems.filter( ( candidate ) =>
			candidate.rect.intersectsRect( target )
		);
		const currentIndex = blockOrder.indexOf( blockClientId );
		const forward = direction === 'right' || direction === 'down';
		// Only swap with the next block in order; the rest reflow around it.
		const targetIndex = forward ? currentIndex + 1 : currentIndex - 1;
		const neighbor = otherItems.find(
			( candidate ) => candidate.clientId === blockOrder[ targetIndex ]
		);
		const canReorder =
			! item.isExplicit &&
			!! neighbor &&
			! neighbor.isExplicit &&
			targets.includes( neighbor ) &&
			! otherItems.some(
				( candidate ) =>
					candidate.isExplicit &&
					candidate.rect.intersectsRect( nearby )
			);

		if ( canReorder ) {
			moveBlocksToPosition(
				[ blockClientId ],
				gridClientId,
				gridClientId,
				targetIndex
			);
			return;
		}

		const rawStyle = blockStyles[ blockClientId ];
		const style = isPlainObject( rawStyle )
			? ( rawStyle as ChildLayoutBlockStyle )
			: undefined;
		updateBlockAttributes( blockClientId, {
			style: getUpdatedChildLayoutStyle(
				style,
				{
					columnStart: target.columnStart,
					rowStart: target.rowStart,
				},
				styleState
			),
		} );
	}

	return (
		<div className="block-editor-grid-item-mover__move-button-container">
			<div className="block-editor-grid-item-mover__move-horizontal-button-container is-left">
				<GridItemMover
					icon={ isRTL() ? chevronRight : chevronLeft }
					label={ isRTL() ? __( 'Move right' ) : __( 'Move left' ) }
					description={
						isRTL() ? __( 'Move right' ) : __( 'Move left' )
					}
					isDisabled={ ! selected || selected.rect.columnStart <= 1 }
					onClick={ () => move( 'left' ) }
				/>
			</div>
			<div className="block-editor-grid-item-mover__move-vertical-button-container">
				<GridItemMover
					className="is-up-button"
					icon={ chevronUp }
					label={ __( 'Move up' ) }
					description={ __( 'Move up' ) }
					isDisabled={ ! selected || selected.rect.rowStart <= 1 }
					onClick={ () => move( 'up' ) }
				/>
				<GridItemMover
					className="is-down-button"
					icon={ chevronDown }
					label={ __( 'Move down' ) }
					description={ __( 'Move down' ) }
					isDisabled={ ! selected }
					onClick={ () => move( 'down' ) }
				/>
			</div>
			<div className="block-editor-grid-item-mover__move-horizontal-button-container is-right">
				<GridItemMover
					icon={ isRTL() ? chevronLeft : chevronRight }
					label={ isRTL() ? __( 'Move left' ) : __( 'Move right' ) }
					description={
						isRTL() ? __( 'Move left' ) : __( 'Move right' )
					}
					isDisabled={
						! selected ||
						! snapshot ||
						selected.rect.columnEnd >= snapshot.columnCount
					}
					onClick={ () => move( 'right' ) }
				/>
			</div>
		</div>
	);
}
