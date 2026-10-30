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
import { getGridTracks, GridRect } from './utils';
import type { ChildLayoutBlockStyle, BlockStyleState } from '../../hooks/types';
import type { GridTrack } from './types';

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

function getTracks(
	template: string,
	gap: string,
	contentSize: number
): GridTrack[] | undefined {
	const sizes = template.split( ' ' ).filter( Boolean );
	if (
		! sizes.length ||
		sizes.some( ( size ) => ! /^\d+(\.\d+)?px$/.test( size ) )
	) {
		return undefined;
	}
	let gapPixels = 0;
	if ( gap.endsWith( '%' ) ) {
		gapPixels = ( parseFloat( gap ) * contentSize ) / 100;
	} else if ( gap !== 'normal' ) {
		gapPixels = parseFloat( gap );
	}
	if ( ! Number.isFinite( gapPixels ) ) {
		return undefined;
	}
	return getGridTracks( sizes.join( ' ' ), gapPixels );
}

function getTrackRange(
	tracks: GridTrack[],
	start: number,
	end: number
): [ number, number ] | undefined {
	const first = tracks.findIndex( ( track ) => track.end > start + 0.1 );
	let last = tracks.length - 1;
	while ( last >= 0 && tracks[ last ].start >= end - 0.1 ) {
		last--;
	}
	if ( first < 0 || last < first ) {
		return undefined;
	}
	return [ first + 1, last + 1 ];
}

function getGridSnapshot(
	gridElement: HTMLElement,
	blockOrder: string[],
	blockStyles: Record< string, unknown >,
	getElement: ( clientId: string ) => Element | null | undefined,
	styleState: BlockStyleState
): GridSnapshot | undefined {
	const view = gridElement.ownerDocument.defaultView;
	if ( ! view || ! gridElement.offsetWidth || ! gridElement.offsetHeight ) {
		return undefined;
	}
	const computed = view.getComputedStyle( gridElement );
	const horizontalInsets =
		parseFloat( computed.borderLeftWidth ) +
		parseFloat( computed.borderRightWidth ) +
		parseFloat( computed.paddingLeft ) +
		parseFloat( computed.paddingRight );
	const verticalInsets =
		parseFloat( computed.borderTopWidth ) +
		parseFloat( computed.borderBottomWidth ) +
		parseFloat( computed.paddingTop ) +
		parseFloat( computed.paddingBottom );
	const columns = getTracks(
		computed.gridTemplateColumns,
		computed.columnGap,
		gridElement.offsetWidth - horizontalInsets
	);
	const rows = getTracks(
		computed.gridTemplateRows,
		computed.rowGap,
		gridElement.offsetHeight - verticalInsets
	);
	if ( ! columns || ! rows ) {
		return undefined;
	}

	const gridBounds = gridElement.getBoundingClientRect();
	const scaleX = gridBounds.width / gridElement.offsetWidth;
	const scaleY = gridBounds.height / gridElement.offsetHeight;
	if ( ! scaleX || ! scaleY ) {
		return undefined;
	}
	const isRightToLeft = computed.direction === 'rtl';
	const inlineOffset =
		parseFloat(
			isRightToLeft ? computed.borderRightWidth : computed.borderLeftWidth
		) +
		parseFloat(
			isRightToLeft ? computed.paddingRight : computed.paddingLeft
		);
	const topOffset =
		parseFloat( computed.borderTopWidth ) +
		parseFloat( computed.paddingTop );

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
		const bounds = element.getBoundingClientRect();
		const startX = isRightToLeft
			? ( gridBounds.right - bounds.right ) / scaleX
			: ( bounds.left - gridBounds.left ) / scaleX;
		const endX = isRightToLeft
			? ( gridBounds.right - bounds.left ) / scaleX
			: ( bounds.right - gridBounds.left ) / scaleX;
		const columnRange = getTrackRange(
			columns,
			startX - inlineOffset,
			endX - inlineOffset
		);
		const rowRange = getTrackRange(
			rows,
			( bounds.top - gridBounds.top ) / scaleY - topOffset,
			( bounds.bottom - gridBounds.top ) / scaleY - topOffset
		);
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
			isExplicit: layout.columnStart !== null || layout.rowStart !== null,
		} );
	}
	return { columnCount: columns.length, items };
}

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
		const targetItem = targets[ 0 ];
		const currentIndex = blockOrder.indexOf( blockClientId );
		const targetIndex = targetItem
			? blockOrder.indexOf( targetItem.clientId )
			: -1;
		const forward = direction === 'right' || direction === 'down';
		const between = blockOrder.slice(
			Math.min( currentIndex, targetIndex ),
			Math.max( currentIndex, targetIndex ) + 1
		);
		const itemsByClientId = new Map(
			current.items.map( ( candidate ) => [
				candidate.clientId,
				candidate,
			] )
		);
		const canReorder =
			! item.isExplicit &&
			item.rect.columnSpan === 1 &&
			item.rect.rowSpan === 1 &&
			targets.length === 1 &&
			targetIndex >= 0 &&
			( forward
				? targetIndex > currentIndex
				: targetIndex < currentIndex ) &&
			! otherItems.some(
				( candidate ) =>
					candidate.isExplicit &&
					candidate.rect.intersectsRect( nearby )
			) &&
			between.every( ( clientId ) => {
				const candidate = itemsByClientId.get( clientId );
				return (
					candidate &&
					! candidate.isExplicit &&
					candidate.rect.columnSpan === 1 &&
					candidate.rect.rowSpan === 1
				);
			} );

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
