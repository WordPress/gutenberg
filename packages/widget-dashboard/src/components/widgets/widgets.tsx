import clsx from 'clsx';
import { forwardRef, useCallback, useMemo } from '@wordpress/element';
import { DashboardGrid, DashboardLanes } from '@wordpress/grid';
import type {
	DashboardGridLayoutItem,
	DashboardLanesLayoutItem,
	DragPreviewRenderProps,
	ResizeHandleRenderProps,
} from '@wordpress/grid';
import type { WidgetName } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardContainerColumnCount } from '../../hooks/use-dashboard-container-column-count';
import { splitWidgetActions } from '../../utils/split-widget-actions';
import { WidgetActions } from '../widget-actions';
import { WidgetAttributes } from '../widget-attributes';
import { WidgetChrome } from '../widget-chrome';
import { WidgetHeader } from '../widget-header';
import { WidgetLayoutControls } from '../widget-layout-controls';
import { WidgetToolbar } from '../widget-toolbar';
import { WidgetResizeHandle } from './widget-resize-handle';
import styles from './widgets.module.css';
import type {
	DashboardInstanceOperation,
	DashboardWidget,
	GridTilePlacement,
	MasonryTilePlacement,
} from '../../types';

/*
 * What the policy allows on one tile. The grid reads `draggable` and
 * `resizable` per item; the others gate the tile's controls and contract.
 */
interface TilePermissions {
	draggable: boolean;
	resizable: boolean;
	removable: boolean;
	editable: boolean;
}

type TilePermissionsFor = ( widget: DashboardWidget ) => TilePermissions;

function toGridLayout(
	widgets: DashboardWidget[],
	permissionsFor: TilePermissionsFor
): DashboardGridLayoutItem[] {
	return widgets.map( ( w ) => {
		const { draggable, resizable } = permissionsFor( w );
		return {
			key: w.uuid,
			...( w.placement as GridTilePlacement | undefined ),
			draggable,
			resizable,
		};
	} );
}

function toMasonryLayout(
	widgets: DashboardWidget[],
	permissionsFor: TilePermissionsFor
): DashboardLanesLayoutItem[] {
	return widgets.map( ( w ) => {
		const { draggable, resizable } = permissionsFor( w );
		return {
			key: w.uuid,
			...( w.placement as MasonryTilePlacement | undefined ),
			draggable,
			resizable,
		};
	} );
}

// The interaction flags are policy, not placement: they never persist.
function applyGridChange(
	widgets: DashboardWidget[],
	gridLayout: DashboardGridLayoutItem[]
): DashboardWidget[] {
	return gridLayout.map( ( { key, draggable, resizable, ...placement } ) => {
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
	return masonryLayout.map(
		( { key, draggable, resizable, ...placement } ) => {
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
		}
	);
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
		const {
			layout,
			onLayoutChange,
			editMode,
			gridSettings,
			widgetTypes,
			canPerform,
		} = useDashboardInternalContext();
		const { containerRef, columnCount } = useDashboardContainerColumnCount(
			ref,
			gridSettings.columns
		);
		const isMasonry = gridSettings.model === 'masonry';

		const permissionsFor = useCallback< TilePermissionsFor >(
			( widget ) => {
				const widgetType = widgetTypes.find(
					( type ) => type.name === widget.type
				);
				const allows = ( operation: DashboardInstanceOperation ) =>
					canPerform( { operation, widget, widgetType } );
				return {
					draggable: allows( 'move' ),
					resizable: allows( 'resize' ),
					removable: allows( 'remove' ),
					editable: allows( 'edit' ),
				};
			},
			[ widgetTypes, canPerform ]
		);

		const gridLayout = useMemo(
			() =>
				isMasonry
					? toMasonryLayout( layout, permissionsFor )
					: toGridLayout( layout, permissionsFor ),
			[ layout, isMasonry, permissionsFor ]
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
			const { removable, resizable, editable } = permissionsFor( widget );
			const hasSettings = editable && !! widgetType?.attributes?.length;

			const isFullBleed = widgetType?.presentation === 'full-bleed';

			const { menu: menuActions } = splitWidgetActions( widgetType );
			const hasActions = menuActions.length > 0;

			// The active mode's controls: layout while customizing, the
			// attribute controls (high-relevance fields on the prominent
			// surface, plus a settings entry point when needed) and the
			// menu actions otherwise.
			let controls: React.ReactNode;
			if ( editMode ) {
				controls =
					removable || resizable ? (
						<WidgetLayoutControls
							widget={ widget }
							canRemove={ removable }
							canResize={ resizable }
						/>
					) : undefined;
			} else if ( ( hasSettings || hasActions ) && widgetType ) {
				controls = (
					<>
						{ hasSettings && (
							<WidgetAttributes
								widget={ widget }
								widgetType={ widgetType }
							/>
						) }

						{ hasActions && (
							<WidgetActions actions={ menuActions } />
						) }
					</>
				);
			}

			const toolbar = controls ? (
				<WidgetToolbar editMode={ editMode }>
					{ controls }
				</WidgetToolbar>
			) : undefined;

			// Normal mode hosts the toolbar in the in-card header, beside the
			// identity. Customize controls and full-bleed widgets need it in
			// the grid's actionable-area slot instead: the slot sits outside
			// the draggable card, so the controls stay clickable (in-card they
			// would be captured by the drag listeners).
			const inSlot = editMode || isFullBleed;
			const actionableArea =
				inSlot && toolbar ? (
					<WidgetHeader overlay>{ toolbar }</WidgetHeader>
				) : undefined;

			return (
				<WidgetChrome
					key={ widget.uuid }
					widget={ widget }
					index={ index }
					className={ clsx( styles.tile, {
						[ styles[ 'tile-edit-mode' ] ]: editMode,
					} ) }
					actionableArea={ actionableArea }
					headerToolbar={ ! inSlot ? toolbar : undefined }
				/>
			);
		} );

		const renderDragPreview = useCallback(
			( { children: clone }: DragPreviewRenderProps ) => (
				<div className={ styles[ 'drag-preview' ] }>{ clone }</div>
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
