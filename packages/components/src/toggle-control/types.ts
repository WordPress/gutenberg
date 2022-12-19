/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';
import type { FormToggleProps } from '../form-toggle/types';

export type ToggleControlProps = Pick<
	FormToggleProps,
	'checked' | 'disabled'
> &
	Pick< BaseControlProps, '__nextHasNoMarginBottom' | 'className' > & {
		help?: ReactNode | ( ( checked: boolean ) => ReactNode );
		/**
		 * The label for the toggle.
		 */
		label: ReactNode;
		/**
		 * A callback function invoked when the toggle is clicked.
		 */
		onChange: ( value: boolean ) => void;
	};
