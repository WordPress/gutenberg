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
import { useDashboardContainerColumnCount } from '../../hooks/use-dashboard-container-column-count';
import { DashboardWidgetChrome } from '../dashboard-widget-chrome';
import { WidgetSettingsToolbar } from '../widget-settings';
import { WidgetLayoutToolbar } from './widget-layout-toolbar';
import { WidgetResizeHandle } from './widget-resize-handle';
import styles from './widgets.module.css';
import type {
	DashboardWidget,
	GridTilePlacement,
	MasonryTilePlacement,
} from '../../types';
import type { WidgetName } from '../../../widget-primitives';

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
		const { layout, onLayoutChange, editMode, gridSettings, widgetTypes } =
			useDashboardInternalContext();
		const { containerRef, columnCount } =
			useDashboardContainerColumnCount( ref );
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

		const children = layout.map( ( widget, index ) => {
			const widgetType = widgetTypes.find(
				( type ) => type.name === widget.type
			);
			const hasSettings = !! widgetType?.attributes?.length;

			// One slot, chosen by mode: layout toolbar while customizing,
			// settings toolbar otherwise (undefined when nothing to configure).
			let actionableArea: React.ReactNode;
			if ( editMode ) {
				actionableArea = <WidgetLayoutToolbar widget={ widget } />;
			} else if ( hasSettings && widgetType ) {
				actionableArea = (
					<WidgetSettingsToolbar
						widget={ widget }
						widgetType={ widgetType }
					/>
				);
			}

			return (
				<DashboardWidgetChrome
					key={ widget.uuid }
					widget={ widget }
					index={ index }
					className={ clsx( styles.tile, {
						[ styles.tileEditMode ]: editMode,
					} ) }
					actionableArea={ actionableArea }
				/>
			);
		} );

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

		const surface: React.ReactNode = isMasonry ? (
			<DashboardLanes
				layout={ gridLayout as DashboardLanesLayoutItem[] }
				columns={ columnCount }
				flowTolerance={ gridSettings.flowTolerance }
				onChangeLayout={ handleMasonryChange }
				{ ...sharedRenderProps }
			>
				{ children }
			</DashboardLanes>
		) : (
			<DashboardGrid
				layout={ gridLayout as DashboardGridLayoutItem[] }
				columns={ columnCount }
				rowHeight={ gridSettings.rowHeight }
				onChangeLayout={ handleGridChange }
				{ ...sharedRenderProps }
			>
				{ children }
			</DashboardGrid>
		);

		return (
			<div
				ref={ containerRef }
				className={ clsx( styles.grid, className ) }
			>
				{ surface }
			</div>
		);
	}
);
