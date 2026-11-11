import { Switch as _Switch } from '@base-ui/react/switch';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Icon } from '../../../icon';
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
	function UnforwardedSwitch( { className, ...props }, ref ) {
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
				<_Switch.Thumb className={ styles.thumb }>
					<Icon
						className={ styles[ 'check-icon' ] }
						icon={ check }
						size={ 16 }
					/>
				</_Switch.Thumb>
			</_Switch.Root>
		);
	}
);
