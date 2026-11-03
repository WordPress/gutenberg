import type { ComponentType } from 'react';
import type { BlockGapValue } from '../hooks/types';

declare global {
	interface Window {
		/**
		 * Whether the grid interactivity experiment is enabled.
		 */
		__experimentalEnableGridInteractivity?: boolean;
	}
}

/**
 * CSS rules for a selector within a layout. A `null` rule value takes the
 * block gap value.
 */
export interface LayoutStyle {
	selector: string;
	rules: Record< string, string | null >;
}

/**
 * The slugs, class name and styles of one layout type.
 */
export interface LayoutDefinition {
	name: string;
	slug: string;
	className: string;
	displayMode?: string;
	baseStyles?: LayoutStyle[];
	spacingStyles?: LayoutStyle[];
}

/**
 * A block's `layout` attribute or support.
 */
export interface Layout {
	type?: string;
	inherit?: boolean;
	/**
	 * The content width; `null` means none, unlike an unset one.
	 */
	contentSize?: string | null;
	/**
	 * The wide width; `null` means none, unlike an unset one.
	 */
	wideSize?: string | null;
	alignments?: string[];
	justifyContent?: string;
	verticalAlignment?: string;
	orientation?: string;
	flexWrap?: string;
	columnCount?: number | null;
	rowCount?: number | null;
	minimumColumnWidth?: string | null;
	isManualPlacement?: boolean;
	autoFit?: boolean;
	[ key: string ]: unknown;
}

/**
 * A block's `layout` support, with the controls a layout type offers.
 */
export interface LayoutBlockSupport {
	allowJustification?: boolean;
	allowCustomContentAndWideSize?: boolean;
	allowOrientation?: boolean;
	allowVerticalAlignment?: boolean;
	allowWrap?: boolean;
	allowSizingOnChildren?: boolean;
	allowSwitching?: boolean;
	allowEditing?: boolean;
	allowInheriting?: boolean;
	/**
	 * The layout a block uses when its attribute sets none.
	 */
	default?: Layout;
	[ key: string ]: unknown;
}

/**
 * Handles a change of a block's layout; `undefined` clears it.
 */
export type LayoutOnChange = ( layout: Layout | undefined ) => void;

/**
 * Props of a layout type's inspector controls.
 */
export interface LayoutInspectorControlsProps {
	layout: Layout;
	/**
	 * The layout attribute of the block, before state and default values.
	 */
	value?: Layout;
	name?: string;
	onChange: LayoutOnChange;
	layoutBlockSupport?: LayoutBlockSupport;
	/**
	 * The layout that resetting a control restores.
	 */
	resetLayout?: Layout;
	clientId?: string;
}

/**
 * Props of a layout type's toolbar controls.
 */
export interface LayoutToolbarControlsProps {
	layout?: Layout;
	name?: string;
	clientId?: string;
	onChange: LayoutOnChange;
	layoutBlockSupport: LayoutBlockSupport;
	controlsGroup?: string;
}

/**
 * Props of a control that edits one property of a layout.
 */
export interface LayoutControlProps {
	layout: Layout;
	onChange: LayoutOnChange;
	isToolbar?: boolean;
}

/**
 * What a layout needs to take over the drag of one of its blocks.
 */
export interface ChildDragOptions {
	/** Client ID of the dragged block. */
	clientId: string;
	/** Client ID of the block whose layout it is. */
	rootClientId: string;
	/** The dragged block's element in the canvas. */
	blockElement: HTMLElement;
	/** Marks blocks as being dragged. */
	startDraggingBlocks: ( clientIds: string[] ) => void;
	/** Marks the drag as over. */
	stopDraggingBlocks: () => void;
}

/**
 * A layout type, such as flow, flex, constrained or grid.
 */
export interface LayoutType {
	name: string;
	label: string;
	hasInspectorControls: (
		layoutBlockSupport?: LayoutBlockSupport
	) => boolean;
	inspectorControls: ComponentType< LayoutInspectorControlsProps >;
	toolBarControls: ComponentType< LayoutToolbarControlsProps >;
	getLayoutStyle?: ( args: LayoutStyleArgs ) => string;
	getOrientation: ( layout: Layout ) => string;
	getAlignments: (
		layout: Layout,
		isBlockBasedTheme?: boolean
	) => LayoutAlignment[];
	/**
	 * Takes over the drag of one of the layout's blocks, dragged by its body,
	 * when the layout moves its blocks itself. Returns whether it did, so that
	 * the block list doesn't start its own drag.
	 */
	startChildDrag?: (
		event: DragEvent,
		args: ChildDragOptions & { layout?: Layout }
	) => boolean;
}

/**
 * The size hint shown for each alignment.
 */
export interface AlignmentsInfo {
	none?: string;
	wide?: string;
	[ alignment: string ]: string | undefined;
}

/**
 * An alignment a layout allows, with its size hint.
 */
export interface LayoutAlignment {
	name: string;
	info?: string;
}

/**
 * Arguments of a layout type's `getLayoutStyle`.
 */
export interface LayoutStyleArgs {
	selector: string;
	layout?: Layout;
	/**
	 * The layout properties a viewport overrides.
	 */
	viewportOverrides?: Layout;
	style?: { spacing?: { blockGap?: BlockGapValue; padding?: unknown } };
	/**
	 * The block gap set in the global styles.
	 */
	globalBlockGapValue?: BlockGapValue;
	blockName: string;
	hasBlockGapSupport?: boolean;
	layoutDefinitions?: Record< string, Partial< LayoutDefinition > > | null;
}
