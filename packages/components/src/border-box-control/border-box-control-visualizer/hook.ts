/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils';

import type { VisualizerProps } from '../types';

export function useBorderBoxControlVisualizer(
	props: WordPressComponentProps< VisualizerProps, 'div' >
) {
	const {
		className,
		value,
		__next40pxDefaultSize = false,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlVisualizer' );

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx(
			styles.borderBoxControlVisualizer( value, __next40pxDefaultSize ),
			className
		);
	}, [ cx, className, value, __next40pxDefaultSize ] );

	return { ...otherProps, className: classes, value };
}
