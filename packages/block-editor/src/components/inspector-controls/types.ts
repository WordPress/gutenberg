import type { ElementType, ReactNode, RefObject } from 'react';
import type { createSlotFill } from '@wordpress/components';
import type { ResetAllContext, ResetAllFilter } from '../../hooks/types';

/**
 * A slot and fill pair.
 */
export type SlotFill = ReturnType< typeof createSlotFill >;

/**
 * Props of `InspectorControls`.
 */
export interface InspectorControlsFillProps {
	children?: ReactNode;
	group?: string;
	resetAllFilter?: ResetAllFilter;
}

/**
 * Props of `InspectorControls.Slot`.
 */
export interface InspectorControlsSlotProps {
	group?: string;
	label?: string;
	fillProps?: Record< string, unknown >;
	[ prop: string ]: unknown;
}

/**
 * Context providers, with their props, that a slot forwards to its fills.
 */
export type ForwardedContext = Array<
	[ ElementType, Record< string, unknown > ]
>;

/**
 * Props of the slot that forwards the tools panel context to its fills.
 */
export interface BlockSupportSlotContainerProps {
	Slot: SlotFill[ 'Slot' ];
	fillProps?: {
		forwardedContext?: ForwardedContext;
		[ prop: string ]: unknown;
	};
	[ prop: string ]: unknown;
}

/**
 * A reset-all filter the block support tools panel runs for each block.
 */
export type BlockSupportResetAllFilter = (
	attributes: Record< string, unknown >,
	context: ResetAllContext
) => Record< string, unknown > | undefined;

/**
 * Props of the component that registers a fill's reset-all filter.
 */
export interface RegisterResetAllProps {
	resetAllFilter?: ResetAllFilter;
	children?: ReactNode;
}

/**
 * Props of the fill content rendered inside a block support tools panel.
 */
export interface ToolsPanelInspectorControlProps {
	children?: ReactNode;
	resetAllFilter?: ResetAllFilter;
	fillProps: { forwardedContext?: ForwardedContext };
}

/**
 * Props of the tools panel that wraps a labelled InspectorControls slot.
 */
export interface BlockSupportToolsPanelProps {
	children?: ReactNode;
	group: string;
	label: string;
}

/**
 * Props of the List View content popover.
 */
export interface ListViewContentPopoverProps {
	listViewRef: RefObject< HTMLElement | null >;
}
