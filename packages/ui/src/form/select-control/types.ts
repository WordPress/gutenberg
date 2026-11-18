import type React from 'react';
import type { ControlProps } from '../types';
import type {
	SelectRootProps,
	SelectTriggerProps,
} from '../primitives/select/types';
import type { ItemPopupWidth } from '../../utils/css/item-popup';

export type SelectItem = {
	label: string;
	value: string | null;
	disabled?: boolean;
	/**
	 * Supplementary text shown under the label in the standard item layout.
	 * Rendered as `SelectControl.ItemDescription`. Compose
	 * `SelectControl.Item` children instead when you need multiple
	 * descriptions or custom markup.
	 */
	description?: string;
};

export type SelectControlTriggerProps = Omit<
	SelectTriggerProps,
	'size' | 'children' | 'variant'
> & {
	/**
	 * The size of the trigger.
	 *
	 * @default 'default'
	 */
	size?: Exclude< SelectTriggerProps[ 'size' ], 'small' >;
	/**
	 * Custom trigger content, or a function that receives the selected item.
	 * When omitted, the selected item's label or placeholder is shown.
	 */
	children?: ( ( item: SelectItem ) => React.ReactNode ) | React.ReactNode;
};

export type SelectControlProps = Omit<
	SelectRootProps< SelectItem >,
	'items' | 'inputRef'
> &
	ControlProps & {
		/**
		 * CSS class to apply.
		 */
		className?: string;
		/**
		 * The array of option items to render in the select.
		 *
		 * Use a non-empty string `value` for an ordinary choice. To
		 * provide an option that clears the selection, use `value: null`.
		 *
		 * Empty string values are treated as empty selections by default.
		 * To preserve an empty string in application state, provide
		 * `itemToStringValue` that returns a unique, non-empty string.
		 * This changes the submitted form value, but not the item passed
		 * to `onValueChange`.
		 */
		items?: SelectItem[];
		/**
		 * Controls how the popup width is constrained relative to its anchor.
		 *
		 * For all presets, the popup is never narrower than its anchor.
		 *
		 * - `'anchor'`: Fixed width matching the anchor width.
		 * - `'content'`: Width grows with item labels between the anchor and available
		 *   viewport bounds.
		 * - `'sm'`: Width grows with content up to the small surface width token (`--wpds-dimension-surface-width-sm`).
		 * - `'md'`: Width grows with content up to the medium surface width token (`--wpds-dimension-surface-width-md`).
		 * - `'lg'`: Width grows with content up to the large surface width token (`--wpds-dimension-surface-width-lg`).
		 * - `'available'`: Fixed width at the available viewport width (`--available-width`).
		 *
		 * @default 'content'
		 */
		popupWidth?: ItemPopupWidth;
		/**
		 * Text to show when no value is selected. This is overridden by custom trigger
		 * children if specified, or by a null item's label in `items`.
		 *
		 * @default __( 'Select' )
		 */
		placeholder?: SelectTriggerProps[ 'placeholder' ];
		/**
		 * Optional trigger element, typically `<SelectControl.Trigger />` with
		 * custom props such as `onFocus` or `onBlur`, or custom children.
		 * When omitted, the default trigger is used. Props on this element
		 * override `size` and `placeholder`.
		 *
		 * ```jsx
		 * trigger={ <SelectControl.Trigger>{ ( item ) => item.label }</SelectControl.Trigger> }
		 * ```
		 */
		trigger?: React.ReactElement< SelectControlTriggerProps >;
		/**
		 * The size of the control.
		 *
		 * @default 'default'
		 */
		size?: Exclude< SelectTriggerProps[ 'size' ], 'small' >;
	};
