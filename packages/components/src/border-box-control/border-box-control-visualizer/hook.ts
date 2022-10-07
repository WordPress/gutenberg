/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx, rtl } from '../../utils';

import type { VisualizerProps } from '../types';

export function useBorderBoxControlVisualizer(
	props: WordPressComponentProps< VisualizerProps, 'div' >
) {
	const {
		className,
		value,
		__next36pxDefaultSize = false,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlVisualizer' );

	// Generate class names.
	const cx = useCx();
	const rtlWatchResult = rtl.watch();
	const classes = useMemo( () => {
		return cx(
			styles.borderBoxControlVisualizer( value, __next36pxDefaultSize ),
			className
		);
		// rtlWatchResult is needed to refresh styles when the writing direction changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ cx, className, value, __next36pxDefaultSize, rtlWatchResult ] );

	return { ...otherProps, className: classes, value };
}
