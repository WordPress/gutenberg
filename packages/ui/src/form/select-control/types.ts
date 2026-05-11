import type React from 'react';
import type { ControlProps } from '../types';
import type {
	SelectRootProps,
	SelectTriggerProps,
} from '../primitives/select/types';

export type SelectItem = {
	label: string;
	value: string;
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
