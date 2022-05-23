/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx, rtl } from '../../utils/';

import type { SplitControlsProps } from '../types';

export function useBorderBoxControlSplitControls(
	props: WordPressComponentProps< SplitControlsProps, 'div' >
) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'BorderBoxControlSplitControls'
	);

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.BorderBoxControlSplitControls, className );
	}, [ className, rtl.watch() ] );

	const centeredClassName = useMemo( () => {
		return cx( styles.CenteredBorderControl, className );
	}, [] );

	const rightAlignedClassName = useMemo( () => {
		return cx( styles.RightBorderControl, className );
	}, [ cx, className, rtl.watch() ] );

	return {
		...otherProps,
		centeredClassName,
		className: classes,
		rightAlignedClassName,
	};
}
