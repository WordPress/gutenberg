/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { DashboardGrid } from '@wordpress/grid';
import type { DashboardGridLayoutItem } from '@wordpress/grid';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from './dashboard-context';
import { Widget } from './widget';
import styles from './widget-dashboard.module.css';
import type { WidgetInstance } from './types';

function toGridLayout( widgets: WidgetInstance[] ): DashboardGridLayoutItem[] {
	return widgets.map( ( w ) => ( {
		key: w.uid,
		width: w.width,
		height: w.height,
		order: w.order,
	} ) );
}

function applyGridChange(
	widgets: WidgetInstance[],
	gridLayout: DashboardGridLayoutItem[]
): WidgetInstance[] {
	return gridLayout.map( ( item ) => {
		const existing = widgets.find( ( w ) => w.uid === item.key );
		if ( ! existing ) {
			return {
				uid: item.key,
				type: '',
				width: item.width,
				height: item.height,
				order: item.order,
			};
		}
		return {
			...existing,
			width: item.width,
			height: item.height,
			order: item.order,
		};
	} );
}

/**
 * Iterates `layout`, delegates each entry to `WidgetDashboard.Widget`, and
 * feeds the resulting tree into `@wordpress/grid`. Collapses to a single
 * column when the container narrows below `collapseWidth`.
 * @param root0
 * @param root0.className
 */
export function Widgets( { className }: { className?: string } ) {
	const {
		layout,
		onLayoutChange,
		editMode,
		columns,
		minColumnWidth,
		collapseWidth,
		rowHeight,
		spacing,
	} = useDashboardInternalContext();

	const [ isNarrow, setIsNarrow ] = useState( false );
	const resizeObserverRef = useResizeObserver( ( [ { contentRect } ] ) => {
		setIsNarrow( contentRect.width < collapseWidth );
	} );

	const gridLayout = useMemo( () => toGridLayout( layout ), [ layout ] );

	const handleLayoutChange = useCallback(
		( newGridLayout: DashboardGridLayoutItem[] ) => {
			onLayoutChange( applyGridChange( layout, newGridLayout ) );
		},
		[ layout, onLayoutChange ]
	);

	const children = layout.map( ( widget, index ) => (
		<Widget key={ widget.uid } widget={ widget } index={ index } />
	) );

	const sharedProps = {
		layout: gridLayout,
		spacing,
		rowHeight,
		editMode,
		onChangeLayout: handleLayoutChange,
	};

	const useFixedColumns = isNarrow || columns !== undefined;
	const fixedColumns = isNarrow ? 1 : columns ?? 6;

	return (
		<div
			ref={ resizeObserverRef }
			className={ clsx( styles.grid, className ) }
		>
			{ useFixedColumns ? (
				<DashboardGrid { ...sharedProps } columns={ fixedColumns }>
					{ children }
				</DashboardGrid>
			) : (
				<DashboardGrid
					{ ...sharedProps }
					minColumnWidth={ minColumnWidth }
				>
					{ children }
				</DashboardGrid>
			) }
		</div>
	);
}
