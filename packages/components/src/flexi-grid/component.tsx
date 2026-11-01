/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useResizeObserver from './use-resize-observer';
import { useCompositeStore } from '../composite/v2';
import { Grid, Row, Cell } from './styles';
import { useFlexiGrid, useFlexiGridCell } from './hook';
import type { FlexiGridCellProps, FlexiGridProps } from './types';

type GridProps = React.ComponentProps< ReturnType< typeof Grid > >;
type RowProps = React.ComponentProps< typeof Row >;
type CellProps = React.ComponentProps< typeof Cell >;

const DEFAULT_GRID_RENDER = <div role="grid" />;
const DEFAULT_CELL_RENDER = <div role="gridcell" />;

function chunkCells( cells: ReactNode[] = [], chunkSize: number ) {
	const chunks: Array< ReactNode[] > = [];

	for ( let i = 0; i < cells.length; i += chunkSize ) {
		chunks.push( cells.slice( i, i + chunkSize ) );
	}

	return chunks;
}

export function FlexiGrid( {
	id: idProp,
	render = DEFAULT_GRID_RENDER,
	...props
}: FlexiGridProps & GridProps & { children: ReactNode } ) {
	const gridRef = useRef< HTMLDivElement >( null );
	const store = useCompositeStore( {
		focusLoop: true,
		rtl: isRTL(),
	} );
	const { activeId } = store.useState();
	const { cells, ...gridProps } = useFlexiGrid( props );
	const [ columnCount, setColumnCount ] = useState( cells.length );
	const rows = chunkCells( cells, columnCount ).map( ( row, index ) => (
		<FlexiGridRow key={ `row-${ index }` }>{ row }</FlexiGridRow>
	) );
	const { minCellWidth, gap, columnGap, rowGap } = props;
	const StyledGrid = useMemo(
		() => Grid( props ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ minCellWidth, gap, columnGap, rowGap ]
	);

	useResizeObserver(
		gridRef,
		( { inlineSize: totalWidth, target } ) => {
			let referenceCell = target.firstElementChild;

			if ( referenceCell?.getAttribute( 'role' ) === 'row' ) {
				referenceCell = referenceCell.firstElementChild;
			}

			const columnWidth =
				referenceCell && 'offsetWidth' in referenceCell
					? ( referenceCell.offsetWidth as number )
					: totalWidth;

			setColumnCount(
				Math.max( 1, Math.floor( totalWidth / columnWidth ) )
			);
			store.setActiveId( activeId );
		},
		[ columnCount ]
	);

	return (
		<StyledGrid
			{ ...gridProps }
			render={ render }
			store={ store }
			ref={ gridRef }
		>
			{ rows }
		</StyledGrid>
	);
}

function FlexiGridRow( props: RowProps ) {
	return <Row { ...props } role="row" />;
}

export function FlexiGridCell( props: FlexiGridCellProps & CellProps ) {
	const { render = DEFAULT_CELL_RENDER } = props;
	const cellProps = useFlexiGridCell( props );

	return <Cell { ...cellProps } render={ render } />;
}

FlexiGrid.Cell = FlexiGridCell;

export default FlexiGrid;
