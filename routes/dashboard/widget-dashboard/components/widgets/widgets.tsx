/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef, useCallback, useMemo } from '@wordpress/element';
import { DashboardGrid } from '@wordpress/grid';
import type {
	DashboardGridLayoutItem,
	DragPreviewRenderProps,
} from '@wordpress/grid';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetChrome } from '../widget-chrome';
import styles from './widgets.module.css';
import type { DashboardWidget, WidgetName } from '../../types';

function toGridLayout( widgets: DashboardWidget[] ): DashboardGridLayoutItem[] {
	return widgets.map( ( w ) => ( {
		key: w.uuid,
		...w.placement,
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

export interface WidgetsProps {
	className?: string;
}

/**
 * Iterates `layout`, delegates each entry to `WidgetDashboard.WidgetChrome`, and
 * feeds the resulting tree into `@wordpress/grid`.
 */
export const Widgets = forwardRef< HTMLDivElement, WidgetsProps >(
	function Widgets( { className }, ref ) {
		const { layout, onLayoutChange, editMode, gridSettings } =
			useDashboardInternalContext();

		const gridLayout = useMemo( () => toGridLayout( layout ), [ layout ] );

		const handleLayoutChange = useCallback(
			( newGridLayout: DashboardGridLayoutItem[] ) => {
				onLayoutChange( applyGridChange( layout, newGridLayout ) );
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

		const sharedProps = {
			layout: gridLayout,
			spacing: gridSettings.spacing,
			rowHeight: gridSettings.rowHeight,
			editMode,
			onChangeLayout: handleLayoutChange,
			renderDragPreview,
		};

		return (
			<div ref={ ref } className={ clsx( styles.grid, className ) }>
				{ gridSettings.columns !== undefined ? (
					<DashboardGrid
						{ ...sharedProps }
						columns={ gridSettings.columns }
					>
						{ children }
					</DashboardGrid>
				) : (
					<DashboardGrid
						{ ...sharedProps }
						minColumnWidth={ gridSettings.minColumnWidth }
					>
						{ children }
					</DashboardGrid>
				) }
			</div>
		);
	}
);
