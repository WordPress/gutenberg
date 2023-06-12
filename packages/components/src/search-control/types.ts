/**
 * External dependencies
 */
import type { HTMLAttributes } from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type SearchControlProps = Pick<
	BaseControlProps,
	'__nextHasNoMarginBottom' | 'help' | 'label'
> & {
	/**
	 * If true, the label will only be visible to screen readers.
	 *
	 * @default true
	 */
	hideLabelFromVision?: boolean;
	/**
	 * A function that receives the value of the input when the value is changed.
	 */
	onChange: ( value: string ) => void;
	/**
	 * When an `onClose` callback is provided, the search control will render a close button
	 * that will trigger the given callback.
	 *
	 * Use this if you want the button to trigger your own logic to close the search field entirely,
	 * rather than just clearing the input value.
	 */
	onClose?: () => void;
	/**
	 * A placeholder for the input.
	 *
	 * @default 'Search'
	 */
	placeholder?: HTMLAttributes< HTMLInputElement >[ 'placeholder' ];
	/**
	 * The current value of the input.
	 */
	value?: string;
};
