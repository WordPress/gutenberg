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
import { useCx } from '../../utils/';

import type { SplitControlsProps } from '../types';

export function useBorderBoxControlSplitControls(
	props: WordPressComponentProps< SplitControlsProps, 'div' >
) {
	const {
		className,
		colors = [],
		enableAlpha = false,
		enableStyle = true,
		__experimentalIsRenderedInSidebar = false,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlSplitControls' );

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderBoxControlSplitControls, className );
	}, [ cx, className ] );

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
		colors,
		enableAlpha,
		enableStyle,
		rightAlignedClassName,
		__experimentalIsRenderedInSidebar,
	};
}
