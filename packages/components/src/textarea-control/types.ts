/**
 * External dependencies
 */
import type { TextareaHTMLAttributes } from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type TextareaControlProps = Pick<
	BaseControlProps,
	'hideLabelFromVision' | 'help' | 'label' | '__nextHasNoMarginBottom'
> & {
	/**
	 * A function that receives the new value of the textarea each time it
	 * changes.
	 */
	onChange: ( value: string ) => void;
	/**
	 * The current value of the textarea.
	 */
	value: string;
	/**
	 * The number of rows the textarea should contain.
	 *
	 * @default 4
	 */
	rows?: TextareaHTMLAttributes< HTMLTextAreaElement >[ 'rows' ];
};
