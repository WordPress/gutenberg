import type { InputProps } from '../input/types';
import type { ComponentProps } from '../../../utils/types';

export type TextareaProps = Omit<
	ComponentProps< 'textarea' >,
	'disabled' | 'rows' | 'value' | 'defaultValue'
> &
	Pick<
		InputProps,
		'value' | 'defaultValue' | 'onValueChange' | 'disabled'
	> & {
		/**
		 * The number of rows the textarea should contain.
		 *
		 * @default 4
		 */
		rows?: React.ComponentProps< 'textarea' >[ 'rows' ];
	};
