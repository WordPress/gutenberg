/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/';

import type { SplitControlsProps } from '../types';

export function useBorderBoxControlSplitControls(
	props: WordPressComponentProps< SplitControlsProps, 'div' >
) {
	const {
		className,
		enableStyle = true,
		size = 'default',
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlSplitControls' );

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderBoxControlSplitControls( size ), className );
	}, [ cx, className, size ] );

	const centeredClassName = useMemo( () => {
		return cx( styles.centeredBorderControl, className );
	}, [ cx, className ] );

	const rightAlignedClassName = useMemo( () => {
		return cx( styles.rightBorderControl(), className );
	}, [ cx, className ] );

	return {
		...otherProps,
		centeredClassName,
		className: classes,
		enableStyle,
		rightAlignedClassName,
		size,
	};
}
