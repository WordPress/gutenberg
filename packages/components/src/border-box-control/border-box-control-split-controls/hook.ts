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
	const rtlWatchResult = rtl.watch();
	const classes = useMemo( () => {
		return cx( styles.borderBoxControlSplitControls(), className );
		// rtlWatchResult is needed to refresh styles when the writing direction changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ cx, className, rtlWatchResult ] );

	const centeredClassName = useMemo( () => {
		return cx( styles.CenteredBorderControl, className );
	}, [ cx, className ] );

	const rightAlignedClassName = useMemo( () => {
		return cx( styles.rightBorderControl(), className );
		// rtlWatchResult is needed to refresh styles when the writing direction changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ cx, className, rtlWatchResult ] );

	return {
		...otherProps,
		centeredClassName,
		className: classes,
		rightAlignedClassName,
	};
}
