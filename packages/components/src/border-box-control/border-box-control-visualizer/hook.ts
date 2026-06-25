/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useCx } from '../../utils';

import type { VisualizerProps } from '../types';

export function useBorderBoxControlVisualizer(
	props: WordPressComponentProps< VisualizerProps, 'div' >
) {
	const { className, value, ...otherProps } = useContextSystem(
		props,
		'BorderBoxControlVisualizer'
	);

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderBoxControlVisualizer( value ), className );
	}, [ cx, className, value ] );

	return { ...otherProps, className: classes, value };
}
