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
	const { className, __next40pxDefaultSize, ...otherProps } =
		useContextSystem( props, 'BorderBoxControlSplitControls' );

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx(
			styles.borderBoxControlSplitControls( __next40pxDefaultSize ),
			className
		);
	}, [ cx, className, __next40pxDefaultSize ] );

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
		rightAlignedClassName,
		__next40pxDefaultSize,
	};
}
