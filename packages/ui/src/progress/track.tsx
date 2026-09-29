import { Progress as _Progress } from '@base-ui/react/progress';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { TrackProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * The neutral track containing the filled progress indicator.
 */
export const Track = forwardRef< HTMLDivElement, TrackProps >(
	function ProgressTrack( { size = 'small', className, ...props }, ref ) {
		return (
			<_Progress.Track
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.track,
					styles[ `is-${ size }` ],
					className
				) }
				{ ...props }
			/>
		);
	}
);
