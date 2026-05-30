/**
 * External dependencies
 */
import type { useDraggable } from '@dnd-kit/core';

// `useDraggable`'s `listeners` and `attributes` types are not exported
// from `@dnd-kit/core`'s public surface, so derive them from the hook
// itself rather than via a deep import.
type DraggableBindings = ReturnType< typeof useDraggable >;

/**
 * Cursor offset reported by the resize handle, in pixels relative to
 * the gesture start. Width and height are independent so the surface
 * can step columns and rows separately.
 */
export type ResizeDelta = {
	width: number;
	height: number;
};

/**
 * Props received by a custom resize handle component. Spread `listeners`
 * and `attributes` onto the element that should respond to the gesture,
 * and assign `ref` to the same element so dnd-kit can track it.
 */
export interface ResizeHandleRenderProps {
	/**
	 * Ref callback to attach to the gesture-bearing element.
	 */
	ref: DraggableBindings[ 'setNodeRef' ];

	/**
	 * Pointer/keyboard event listeners that initiate the drag.
	 */
	listeners: DraggableBindings[ 'listeners' ];

	/**
	 * Accessibility and dnd-kit attributes (role, aria-*, tabIndex…).
	 */
	attributes: DraggableBindings[ 'attributes' ];

	/**
	 * Whether vertical resizing is allowed for this tile. Useful for
	 * adapting the cursor or visual cue.
	 */
	verticalResizable: boolean;

	/**
	 * True while the user is actively dragging this handle. Use it to
	 * swap colors, icons, or transforms during the gesture.
	 */
	isResizing: boolean;

	/**
	 * Owning item's `key`. Available so consumers can render per-tile
	 * content if needed.
	 */
	itemId?: string;
}

/**
 * Props received by a custom drag-preview component. The surface mounts
 * the component inside `<DragOverlay>` and supplies the active tile's
 * cloned children plus its `key`. The component is responsible for the
 * visual chrome of the dragged clone (shadow, radius, padding); the
 * surface keeps a thin functional wrapper around it that owns the lift
 * cue, the cursor, and pointer pass-through during the gesture.
 */
export interface DragPreviewRenderProps {
	/**
	 * The cloned tile content the surface mounts inside the
	 * `<DragOverlay>` portal. Render it where the visual wrapper
	 * expects the tile body.
	 */
	children: React.ReactNode;

	/**
	 * Owning tile's `key`. Useful when the visual chrome needs to
	 * vary by which tile is being dragged.
	 */
	itemId: string;
}

/**
 * Props received by a custom grid overlay component. The overlay
 * paints behind the tiles in edit mode to visualize the column tracks
 * and (when `rowHeight` is defined) the row tracks. Receives a
 * snapshot of the surface's resolved layout parameters so the visual
 * can reproduce the tracks pixel-accurately without re-deriving them.
 *
 * Reused by both `DashboardGrid` and `DashboardLanes`: lanes pass no
 * `rowHeight` because heights are content-driven.
 */
export interface GridOverlayRenderProps {
	/**
	 * Number of column tracks in the active surface. In responsive
	 * mode (`minColumnWidth`), this is the count derived from the
	 * container width, not the prop value.
	 */
	columns: number;

	/**
	 * Row height in pixels for surfaces with uniform rows. Omitted on
	 * surfaces with content-driven heights (lanes) or when row height
	 * is `'auto'`; in those cases row markers are omitted.
	 */
	rowHeight?: number;

	/**
	 * Number of row tracks to mirror in each column. Derived from the
	 * grid container height when `rowHeight` is numeric; omitted when
	 * row height is unknown.
	 */
	rows?: number;

	/**
	 * Whether the overlay should be visible. Surfaces render the
	 * overlay even when `false` so the implementation can transition
	 * opacity in and out; while `false`, the overlay must hide itself
	 * (and ideally release paint cost via `visibility: hidden` or an
	 * equivalent).
	 */
	isActive: boolean;
}

/**
 * Props for the internal `<ResizeHandle />` wrapper.
 */
export interface ResizeHandleProps {
	/**
	 * Owning item's `key`. Forwarded as `data.itemId` on the draggable
	 * so the parent can correlate the gesture with a tile if needed.
	 */
	itemId?: string;

	/**
	 * Whether the handle should track vertical movement. When false,
	 * the handle still appears but only emits horizontal deltas, and
	 * the cursor is constrained to the column resize axis.
	 *
	 * @default true
	 */
	verticalResizable?: boolean;

	/**
	 * Callback fired while the handle is being dragged. Receives the
	 * cursor offset from the gesture start in pixels.
	 */
	onResize?: ( delta: ResizeDelta ) => void;

	/**
	 * Callback fired when the gesture ends.
	 */
	onResizeEnd?: () => void;

	/**
	 * Component that overrides the default corner triangle with a
	 * custom element. Receives gesture wiring (`ref`, `listeners`,
	 * `attributes`) plus context. The surface keeps ownership of the
	 * `<DndContext>` and the throttled delta loop; consumers are only
	 * responsible for the visual.
	 */
	renderResizeHandle?: React.ComponentType< ResizeHandleRenderProps >;
}
