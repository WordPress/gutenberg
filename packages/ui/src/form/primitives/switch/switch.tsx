import { Switch as _Switch } from '@base-ui/react/switch';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import focusStyles from '../../../utils/css/focus.module.scss';
import styles from './style.module.css';
import type { SwitchProps } from './types';

/**
 * A low-level switch primitive.
 *
 * Use `Field` to associate an accessible label.
 */
export const Switch = forwardRef< HTMLSpanElement, SwitchProps >(
	function Switch( { className, ...props }, ref ) {
		return (
			<_Switch.Root
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					focusStyles[ 'outset-ring--focus' ],
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
