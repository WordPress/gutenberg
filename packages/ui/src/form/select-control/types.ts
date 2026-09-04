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
		 * - `'sm'`: Fixed width at the small surface width token (`--wpds-dimension-surface-width-sm`).
		 * - `'md'`: Fixed width at the medium surface width token (`--wpds-dimension-surface-width-md`).
		 * - `'lg'`: Fixed width at the large surface width token (`--wpds-dimension-surface-width-lg`).
		 * - `'available'`: Fixed width at the available viewport width (`--available-width`).
		 *
		 * @default 'content'
		 */
		popupWidth?: ItemPopupWidth;
		/**
		 * Text to show when no value is selected. This is overridden by `triggerContent`
		 * if specified, or by a null item's label in `items`.
		 *
		 * @default __( 'Select' )
		 */
		placeholder?: SelectTriggerProps[ 'placeholder' ];
		/**
		 * The custom trigger content to use instead of the default.
		 *
		 * ```jsx
		 * triggerContent={ ( item ) => item.label }
		 * ```
		 */
		triggerContent?:
			| ( ( item: SelectItem ) => React.ReactNode )
			| React.ReactNode;
		/**
		 * The size of the control.
		 *
		 * @default 'default'
		 */
		size?: Exclude< SelectTriggerProps[ 'size' ], 'small' >;
	};
