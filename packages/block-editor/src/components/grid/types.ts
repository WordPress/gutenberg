import type { CSSProperties, ReactNode, Ref } from 'react';
import type { Layout } from '../../layouts/types';
import type { GridRect } from './utils';
import type { BlockStyleState, ChildLayoutBlockStyle } from '../../hooks/types';

/**
 * The position and size of a block within its grid, from `style.layout`.
 */
export interface GridItemLayout {
	columnStart?: number | null;
	rowStart?: number | null;
	columnSpan?: number;
	rowSpan?: number;
	[ key: string ]: unknown;
}

/**
 * Attributes of a grid item block, positioned by `style.layout`.
 */
export interface GridItemAttributes {
	style?: { layout?: GridItemLayout; [ key: string ]: unknown };
	[ key: string ]: unknown;
}

export interface GridItemDimensions {
	offsetWidth: number;
	offsetHeight: number;
	scrollWidth: number;
	scrollHeight: number;
}

/**
 * The area of a grid a `GridRect` covers. Spans take precedence over ends.
 */
export interface GridRectOptions {
	columnStart?: number | null;
	rowStart?: number | null;
	columnEnd?: number;
	rowEnd?: number;
	columnSpan?: number;
	rowSpan?: number;
}

/**
 * The start and end position in pixels of a grid track.
 */
export interface GridTrack {
	start: number;
	end: number;
}

/**
 * The size, color and template of a grid.
 */
export interface GridInfo {
	numColumns: number;
	numRows: number;
	numItems: number;
	currentColor: string;
	style: CSSProperties;
}

/**
 * The sides a grid item can be resized from.
 */
export interface GridItemResizerSides {
	top: boolean;
	bottom: boolean;
	left: boolean;
	right: boolean;
}

export interface GridItemResizerProps {
	/** Client ID of the grid item block. */
	clientId: string;
	/** Bounds the resizer cannot exceed. */
	bounds?: 'window' | 'parent' | HTMLElement;
	/** Called with the new position and size of the grid item. */
	onChange: ( layout: GridItemLayout ) => void;
	/** Layout of the grid block. */
	parentLayout: Layout;
}

export interface GridItemResizerInnerProps extends Omit<
	GridItemResizerProps,
	'parentLayout'
> {
	blockElement: HTMLElement;
	rootBlockElement: HTMLElement;
	isManualGrid?: boolean;
	collapseEmptyColumnGaps?: boolean;
}

export interface GridItemMoversProps {
	/** Style attributes of the grid item. */
	style?: ChildLayoutBlockStyle;
	/** Selected style state of the grid item. */
	selectedState?: BlockStyleState;
	/** Whether responsive editing is enabled. */
	isResponsiveEditing?: boolean;
	/** Layout of the grid block. */
	parentLayout?: Layout;
	/** Called with the new position of the grid item. */
	onChange: ( layout: GridItemLayout ) => void;
	/** Client ID of the grid block. */
	gridClientId: string;
	/** Client ID of the grid item block. */
	blockClientId: string;
}

export interface GridItemMoverProps {
	className?: string;
	icon: React.JSX.Element;
	label: string;
	isDisabled?: boolean | 0 | null;
	onClick: () => void;
	description: string;
}

export interface GridVisualizerProps {
	/** Client ID of the grid block. */
	clientId: string;
	/** Ref to the element holding the grid cells. */
	contentRef?: Ref< HTMLDivElement >;
	/** Layout of the grid block. */
	parentLayout?: Layout;
	/** Client ID of a selected child that is itself a grid. */
	childGridClientId?: string;
}

export interface GridVisualizerGridProps {
	gridClientId: string;
	gridElement: Element;
	isManualGrid?: boolean;
	childGridClientId?: string;
}

export interface GridVisualizerCellProps {
	color: string;
	children?: ReactNode;
	className?: string | false;
	column?: number;
	row?: number;
}

/**
 * An appender's position in a manual grid.
 */
export interface GridVisualizerCellPosition {
	column: number;
	row: number;
	gridClientId: string;
	gridInfo: GridInfo;
}

/**
 * A dragged block's data for committing a drop.
 */
export interface GridDropBlock {
	clientId: string;
	attributes: Record< string, unknown >;
	selectedState: BlockStyleState | undefined;
}

export interface GridDropPlacement {
	clientId: string;
	rect: GridRect;
}

export interface AutoGridVisualizerProps {
	gridInfo: GridInfo;
	childGridRect: GridRect | null;
}

export interface ManualGridVisualizerProps extends AutoGridVisualizerProps {
	gridClientId: string;
	gridElement: Element;
	isDragging: boolean;
}
