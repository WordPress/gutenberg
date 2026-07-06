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
	 * The selection ("active") state of the field, for controlled usage.
	 * When omitted, the control manages its own selection state from the
	 * focus/blur transitions (deferring deselection so a format popover opened
	 * from the field can claim focus without the field deselecting).
	 */
	isSelected?: boolean;
	/**
	 * The initial selection state for uncontrolled usage.
	 *
	 * @default false
	 */
	defaultIsSelected?: boolean;
	/**
	 * Called when the field gains or loses an "active" selection, in both
	 * controlled and uncontrolled usage.
	 */
	onSelectedChange?: ( isSelected: boolean ) => void;
	/**
	 * Placeholder slot for the rich-text assembly (e.g. `FormatEdit` and its
	 * context providers), mounted only while the field has an active
	 * selection.
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
