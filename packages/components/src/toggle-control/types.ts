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
		/**
		 * If this property is added, a help text will be generated using help
		 * property as the content. For controlled components, `help` can also
		 * be a function which returns help text dynamically depending on the
		 * `checked` parameter.
		 */
		help?: ReactNode | ( ( checked: boolean ) => ReactNode );
		/**
		 * If this property is added, a label will be generated using label
		 * property as the content.
		 */
		label: ReactNode;
		/**
		 * A callback function invoked when the toggle is clicked. Receives the
		 * new checked state (boolean) as input.
		 */
		onChange: ( value: boolean ) => void;
		/**
		 * The position of the toggle switch relative to the label. Use `'start'`
		 * to position the toggle before the label (default), or `'end'` to
		 * position it after the label.
		 *
		 * @default 'start'
		 */
		togglePosition?: 'start' | 'end';
	};
