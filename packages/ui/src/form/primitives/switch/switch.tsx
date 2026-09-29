import { Switch as _Switch } from '@base-ui/react/switch';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import styles from './style.module.scss';
import type { SwitchProps } from './types';

/**
 * A low-level switch primitive.
 *
 * Use `Field` to associate an accessible label.
 *
 * Prefer `SwitchControl` for labeled items.
 */
export const Switch = forwardRef< HTMLSpanElement, SwitchProps >(
	function Switch( { className, ...props }, ref ) {
		return (
			<_Switch.Root
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.root,
					className
				) }
				{ ...props }
			>
				<_Switch.Thumb className={ styles.thumb } />
			</_Switch.Root>
		);
	}
);
