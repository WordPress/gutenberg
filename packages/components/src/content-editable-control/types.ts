import type { BaseControlProps } from '../base-control/types';

export type ContentEditableControlProps = Pick<
	BaseControlProps,
	'className' | 'hideLabelFromVision' | 'help'
> & {
	/**
	 * Label text for the control.
	 */
	label: string;
	/**
	 * Whether the field is non-editable. A disabled field exposes
	 * `aria-disabled` and, like a native disabled field, takes no focus from
	 * the Tab key or a click. It keeps focus if it had it.
	 *
	 * @default false
	 */
	disabled?: boolean;
	/**
	 * Whether the field is required. Exposed to assistive technology via
	 * `aria-required`.
	 *
	 * @default false
	 */
	required?: boolean;
	/**
	 * Placeholder text shown while the element has no content. Exposed to
	 * assistive technology via `aria-placeholder` and drawn by the stylesheet
	 * when the element is empty.
	 */
	placeholder?: string;
};
