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
	 * When omitted, the control manages its own selection state directly from
	 * the focus/blur transitions. Consumers whose format UI opens popovers
	 * must control this prop and implement their own blur handling, since
	 * only the consumer can tell whether the element receiving focus belongs
	 * to one of its popovers.
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
