/**
 * Internal dependencies
 */
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
	 * Whether the field is non-editable. A disabled field is not
	 * `contentEditable` (so it is neither focusable nor editable) and exposes
	 * `aria-disabled` to assistive technology.
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
};
