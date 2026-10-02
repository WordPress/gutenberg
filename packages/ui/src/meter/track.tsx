import { Meter as _Meter } from '@base-ui/react/meter';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { TrackProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * The neutral track containing the filled meter indicator.
 */
const Track = forwardRef< HTMLDivElement, TrackProps >( function MeterTrack(
	{ className, ...props },
	ref
) {
	return (
		<_Meter.Track
			ref={ ref }
			className={ clsx(
				resetStyles[ 'box-sizing' ],
				styles.track,
				className
			) }
			{ ...props }
		/>
	);
} );

export { Track };
