/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef, useCallback, useMemo } from '@wordpress/element';
import { DashboardGrid, DashboardLanes } from '@wordpress/grid';
import type {
	DashboardGridLayoutItem,
	DashboardLanesLayoutItem,
	DragPreviewRenderProps,
	ResizeHandleRenderProps,
} from '@wordpress/grid';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetChrome } from '../widget-chrome';
import { WidgetResizeHandle } from './widget-resize-handle';
import styles from './widgets.module.css';
import type {
	DashboardWidget,
	GridTilePlacement,
	MasonryTilePlacement,
	WidgetName,
} from '../../types';

function toGridLayout( widgets: DashboardWidget[] ): DashboardGridLayoutItem[] {
	return widgets.map( ( w ) => ( {
		key: w.uuid,
		...( w.placement as GridTilePlacement | undefined ),
	} ) );
}

function toMasonryLayout(
	widgets: DashboardWidget[]
): DashboardLanesLayoutItem[] {
	return widgets.map( ( w ) => ( {
		key: w.uuid,
		...( w.placement as MasonryTilePlacement | undefined ),
	} ) );
}

function applyGridChange(
	widgets: DashboardWidget[],
	gridLayout: DashboardGridLayoutItem[]
): DashboardWidget[] {
	return gridLayout.map( ( { key, ...placement } ) => {
		const existing = widgets.find( ( w ) => w.uuid === key );
		if ( ! existing ) {
			return {
				uuid: key,
				type: '' as WidgetName,
				placement,
			};
		}
		return {
			...existing,
			placement,
		};
	} );
}

function applyMasonryChange(
	widgets: DashboardWidget[],
	masonryLayout: DashboardLanesLayoutItem[]
): DashboardWidget[] {
	return masonryLayout.map( ( { key, ...placement } ) => {
		const existing = widgets.find( ( w ) => w.uuid === key );
		if ( ! existing ) {
			return {
				uuid: key,
				type: '' as WidgetName,
				placement,
			};
		}
		return {
			...existing,
			placement,
		};
	} );
}

export interface WidgetsProps {
	className?: string;
}

/**
 * Iterates `layout`, delegates each entry to `WidgetDashboard.WidgetChrome`, and
 * feeds the resulting tree into the active `@wordpress/grid` surface (2D grid
 * or masonry, picked from `gridSettings.model`).
 */
export const Widgets = forwardRef< HTMLDivElement, WidgetsProps >(
	function Widgets( { className }, ref ) {
		const { layout, onLayoutChange, editMode, gridSettings } =
			useDashboardInternalContext();

		const isMasonry = gridSettings.model === 'masonry';

		const gridLayout = useMemo(
			() =>
				isMasonry ? toMasonryLayout( layout ) : toGridLayout( layout ),
			[ layout, isMasonry ]
		);

		const handleGridChange = useCallback(
			( newGridLayout: DashboardGridLayoutItem[] ) => {
				onLayoutChange( applyGridChange( layout, newGridLayout ) );
			},
			[ layout, onLayoutChange ]
		);

		const handleMasonryChange = useCallback(
			( newMasonryLayout: DashboardLanesLayoutItem[] ) => {
				onLayoutChange(
					applyMasonryChange( layout, newMasonryLayout )
				);
			},
			[ layout, onLayoutChange ]
		);

		const children = layout.map( ( widget, index ) => (
			<div
				key={ widget.uuid }
				className={ clsx( styles.tile, {
					[ styles.tileEditMode ]: editMode,
				} ) }
				tabIndex={ editMode ? 0 : undefined }
			>
				<WidgetChrome widget={ widget } index={ index } />
			</div>
		) );

		const renderDragPreview = useCallback(
			( { children: clone }: DragPreviewRenderProps ) => (
				<div className={ styles.dragPreview }>{ clone }</div>
			),
			[]
		);

		const sharedRenderProps = {
			editMode,
			renderDragPreview,
			renderResizeHandle:
				WidgetResizeHandle as React.ComponentType< ResizeHandleRenderProps >,
		};

		let surface: React.ReactNode;
		if ( isMasonry ) {
			surface =
				gridSettings.columns !== undefined ? (
					<DashboardLanes
						layout={ gridLayout as DashboardLanesLayoutItem[] }
						columns={ gridSettings.columns }
						flowTolerance={ gridSettings.flowTolerance }
						onChangeLayout={ handleMasonryChange }
						{ ...sharedRenderProps }
					>
						{ children }
					</DashboardLanes>
				) : (
					<DashboardLanes
						layout={ gridLayout as DashboardLanesLayoutItem[] }
						minColumnWidth={ gridSettings.minColumnWidth }
						flowTolerance={ gridSettings.flowTolerance }
						onChangeLayout={ handleMasonryChange }
						{ ...sharedRenderProps }
					>
						{ children }
					</DashboardLanes>
				);
		} else {
			surface =
				gridSettings.columns !== undefined ? (
					<DashboardGrid
						layout={ gridLayout as DashboardGridLayoutItem[] }
						columns={ gridSettings.columns }
						rowHeight={ gridSettings.rowHeight }
						onChangeLayout={ handleGridChange }
						{ ...sharedRenderProps }
					>
						{ children }
					</DashboardGrid>
				) : (
					<DashboardGrid
						layout={ gridLayout as DashboardGridLayoutItem[] }
						minColumnWidth={ gridSettings.minColumnWidth }
						rowHeight={ gridSettings.rowHeight }
						onChangeLayout={ handleGridChange }
						{ ...sharedRenderProps }
					>
						{ children }
					</DashboardGrid>
				);
		}

		return (
			<div ref={ ref } className={ clsx( styles.grid, className ) }>
				{ surface }
			</div>
		);
	}
);
