import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type ButtonCaretProps } from './types';
import { Caret } from '../utils/caret';
import styles from './style.module.css';

/**
 * A caret placed after the label of a `Button` that opens a menu or popover.
 * It matches the caret in the `Select` trigger in size, stroke, and spacing.
 */
export const ButtonCaret = forwardRef< SVGSVGElement, ButtonCaretProps >(
	function UnforwardedButtonCaret( { className, ...props }, ref ) {
		return (
			<Caret
				ref={ ref }
				className={ clsx( styles.caret, className ) }
				{ ...props }
			/>
		);
	}
);
