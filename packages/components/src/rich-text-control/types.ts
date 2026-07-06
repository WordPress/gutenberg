/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type RichTextControlProps = Pick<
	BaseControlProps,
	'className' | 'hideLabelFromVision'
> & {
	/**
	 * Label text for the control.
	 */
	label: string;
	/**
	 * Called when the field gains or loses an "active" selection. The control
	 * is controlled: it owns no selection state itself, it only drives the
	 * focus/blur transitions (deferring deselection so a format popover opened
	 * from the field can claim focus without the field deselecting).
	 */
	onSelectedChange?: ( isSelected: boolean ) => void;
	/**
	 * Placeholder slot for the rich-text assembly (e.g. `FormatEdit` and its
	 * context providers). Rendered inside the control's private
	 * `SlotFillProvider` so any format popovers portal into this control's own
	 * `Popover.Slot`.
	 */
	children?: ReactNode;
	/**
	 * Unique identifier for the control.
	 */
	id?: string;
	/**
	 * Whether line breaks are disabled. Drives `aria-multiline`.
	 */
	disableLineBreaks?: boolean;
};
