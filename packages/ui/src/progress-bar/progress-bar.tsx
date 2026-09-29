import { Progress as _Progress } from '@base-ui/react/progress';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { ProgressBarProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * Displays the progress of a task. Omit `value` for indeterminate progress.
 * Provide `aria-label` or `aria-labelledby` to describe the task.
 */
export const ProgressBar = forwardRef< HTMLDivElement, ProgressBarProps >(
	function UnforwardedProgressBar(
		{
			value = null,
			size = 'small',
			tone = 'neutral',
			color,
			className,
			style,
			...props
		},
		ref
	) {
		return (
			<_Progress.Root
				ref={ ref }
				value={ value }
				style={ color === undefined ? style : { ...style, color } }
				aria-label={ __( 'Loading' ) }
				getAriaValueText={ ( formattedValue ) =>
					formattedValue || __( 'In progress' )
				}
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.track,
					styles[ `is-${ size }` ],
					styles[ `is-${ tone }` ],
					className
				) }
				{ ...props }
			>
				<_Progress.Indicator className={ styles.indicator } />
			</_Progress.Root>
		);
	}
);
