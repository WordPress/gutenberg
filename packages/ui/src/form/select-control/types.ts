import type React from 'react';
import type { ControlProps } from '../types';
import type {
	SelectRootProps,
	SelectTriggerProps,
} from '../primitives/select/types';

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
