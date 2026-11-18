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
import { getUpdatedChildLayoutStyle } from '../../hooks/layout-child-utils';
import { isPlainObject } from '../../utils/object';
import { GridItemMover } from './grid-item-movers';
import {
	getGridMeasurement,
	getRectInGrid,
	getTrackRange,
	GridRect,
} from './utils';
import {
	findAutoGridReorderIndex,
	type AutoGridMoveDirection,
	type AutoGridSnapshot,
} from './auto-grid-placement';
import type { ChildLayoutBlockStyle } from '../../hooks/types';

const DIRECTION_OFFSETS: Record< AutoGridMoveDirection, [ number, number ] > = {
	left: [ -1, 0 ],
	right: [ 1, 0 ],
	up: [ 0, -1 ],
	down: [ 0, 1 ],
};

function hasAppliedGridStart(
	computedStyle: CSSStyleDeclaration,
	axis: 'column' | 'row'
) {
	const computedStart = computedStyle
		.getPropertyValue( `grid-${ axis }-start` )
		.trim();
	return computedStart !== 'auto' && ! computedStart.startsWith( 'span ' );
}

/**
 * Reads where each child of an auto grid is rendered, as column and row
 * ranges, and whether it has an explicit position.
 *
 * @param gridElement The grid element.
 * @param blockOrder  The client IDs of the grid's children.
 * @param getElement  Gets the element of a block by client ID.
 * @param isAutoFit   Whether empty auto-fit column tracks collapse.
 *
 * @return The grid's track counts and items, or undefined if the grid can't
 *         be measured.
 */
function getGridSnapshot(
	gridElement: HTMLElement,
	blockOrder: string[],
	getElement: ( clientId: string ) => Element | null | undefined,
	isAutoFit: boolean
): AutoGridSnapshot | undefined {
	const measurement = getGridMeasurement( gridElement, isAutoFit );
	if ( ! measurement ) {
		return undefined;
	}
	const { columns, rows } = measurement;
	// Tracks are not measurable in pixels, for example when not a grid.
	if (
		[ ...columns, ...rows ].some( ( { end } ) => ! Number.isFinite( end ) )
	) {
		return undefined;
	}

	const items: AutoGridSnapshot[ 'items' ] = [];
	for ( const clientId of blockOrder ) {
		const element = getElement( clientId );
		if (
			! element ||
			element.parentElement !== gridElement ||
			! element.getClientRects().length
		) {
			continue;
		}
		const bounds = getRectInGrid( gridElement, element, measurement );
		if ( ! bounds ) {
			continue;
		}
		const columnRange = getTrackRange( columns, bounds.left, bounds.right );
		const rowRange = getTrackRange( rows, bounds.top, bounds.bottom );
		if ( ! columnRange || ! rowRange ) {
			continue;
		}
		const computedStyle =
			element.ownerDocument.defaultView!.getComputedStyle( element );
		items.push( {
			clientId,
			rect: new GridRect( {
				columnStart: columnRange[ 0 ],
				columnEnd: columnRange[ 1 ],
				rowStart: rowRange[ 0 ],
				rowEnd: rowRange[ 1 ],
			} ),
			columnStart: hasAppliedGridStart( computedStyle, 'column' )
				? columnRange[ 0 ]
				: undefined,
			rowStart: hasAppliedGridStart( computedStyle, 'row' )
				? rowRange[ 0 ]
				: undefined,
		} );
	}
	// The resolved row tracks include implicit rows created by auto-placement.
	return {
		columnCount: columns.length,
		rowCount: rows.length,
		items,
	};
}

/**
 * Directional movers for a child of an auto grid. Each move reorders the block
 * if it can be auto-placed in that direction, and otherwise pins it to the
 * target cell with an explicit column and row start.
 *
 * @param props
 * @param props.blockClientId The client ID of the child block.
 * @param props.gridClientId  The client ID of the grid block.
 * @param props.isAutoFit     Whether the grid collapses empty column tracks.
 */
export default function AutoGridItemMovers( {
	blockClientId,
	gridClientId,
	isAutoFit,
}: {
	blockClientId: string;
	gridClientId: string;
	isAutoFit: boolean;
} ) {
	const { refsMap } = useContext( BlockRefs );
	const blockElement = useBlockElement( blockClientId );
	const { blockOrder, blockStyle, styleState } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockStyles,
				getSelectedBlockStyleState,
			} = unlock( select( blockEditorStore ) );
			const order: string[] = getBlockOrder( gridClientId );
			return {
				blockOrder: order,
				blockStyle: getBlockStyles( [ blockClientId ] )[
					blockClientId
				],
				styleState: getSelectedBlockStyleState( blockClientId ),
			};
		},
		[ blockClientId, gridClientId ]
	);
	const { moveBlocksToPosition, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const [ snapshot, setSnapshot ] = useState< AutoGridSnapshot >();

	const readSnapshot = useCallback( () => {
		const gridElement = blockElement?.parentElement;
		if ( ! gridElement ) {
			return undefined;
		}
		return getGridSnapshot(
			gridElement,
			blockOrder,
			( clientId ) => refsMap.get( clientId ),
			isAutoFit
		);
	}, [ blockElement, blockOrder, isAutoFit, refsMap ] );

	// Style and style-state changes can reposition the selected item without
	// resizing it, so they intentionally invalidate this measurement effect.
	useEffect( () => {
		const gridElement = blockElement?.parentElement;
		if ( ! gridElement ) {
			setSnapshot( undefined );
			return;
		}
		const update = () => setSnapshot( readSnapshot() );
		update();
		// The grid's DOM and generated child layout styles can update after
		// this effect, and moving an item doesn't resize anything, so measure
		// again once the browser has laid out the change.
		let frame = requestAnimationFrame( () => {
			update();
			frame = requestAnimationFrame( update );
		} );
		const observer = new ResizeObserver( update );
		observer.observe( gridElement );
		for ( const clientId of blockOrder ) {
			const element = refsMap.get( clientId );
			if ( element ) {
				observer.observe( element );
			}
		}
		// Remeasure when the moving animation removes its temporary transform.
		const movementObserver = new MutationObserver( () => {
			if ( ! ( blockElement as HTMLElement ).style.transform ) {
				update();
			}
		} );
		movementObserver.observe( blockElement, {
			attributes: true,
			attributeFilter: [ 'style' ],
		} );
		return () => {
			cancelAnimationFrame( frame );
			observer.disconnect();
			movementObserver.disconnect();
		};
	}, [
		blockElement,
		blockOrder,
		blockStyle,
		refsMap,
		readSnapshot,
		styleState,
	] );

	const selected = snapshot?.items.find(
		( item ) => item.clientId === blockClientId
	);

	function move( direction: AutoGridMoveDirection ) {
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
			target.rowStart < 1 ||
			target.rowEnd > current.rowCount
		) {
			return;
		}

		const targetIndex = findAutoGridReorderIndex(
			current,
			blockOrder,
			blockClientId,
			target,
			direction
		);
		if ( targetIndex !== undefined ) {
			moveBlocksToPosition(
				[ blockClientId ],
				gridClientId,
				gridClientId,
				targetIndex
			);
			return;
		}

		const style = isPlainObject( blockStyle )
			? ( blockStyle as ChildLayoutBlockStyle )
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
					isDisabled={
						! selected ||
						! snapshot ||
						selected.rect.rowEnd >= snapshot.rowCount
					}
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
