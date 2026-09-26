import type { Input } from '@base-ui/react/input';
import type { InputLayoutProps } from '../input-layout/types';
import type { ComponentProps } from '../../../utils/types';

export type InputProps = Omit<
	ComponentProps< typeof Input >,
	'value' | 'defaultValue' | 'type' | 'disabled' | 'prefix' | 'size'
> &
	Pick< InputLayoutProps, 'prefix' | 'suffix' > & {
		/**
		 * Whether the field is disabled.
		 */
		disabled?: boolean;
	} & {
		/**
		 * The type of the input element.
		 */
		type?: Input.Props[ 'type' ];
		/**
		 * The default value to use in uncontrolled mode.
		 */
		defaultValue?: Input.Props[ 'defaultValue' ];
		/**
		 * The value to use in controlled mode.
		 */
		value?: Input.Props[ 'value' ];
		/**
		 * The size of the field.
		 */
		size?: Exclude< InputLayoutProps[ 'size' ], 'small' >;
	};
