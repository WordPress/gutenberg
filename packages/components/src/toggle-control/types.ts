/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';
import type { FormToggleProps } from '../form-toggle/types';

export type ToggleControlProps = Pick<
	FormToggleProps,
	'checked' | 'disabled'
> &
	Pick<
		BaseControlProps,
		'__nextHasNoMarginBottom' | 'label' | 'help' | 'className'
	> & {
		/**
		 * A callback function invoked when the toggle is clicked.
		 */
		onChange: ( value: boolean ) => void;
	};
