/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';
import type { ScrollableProps } from './types';

export function useScrollable(
	props: WordPressComponentProps< ScrollableProps, 'div' >
) {
	const {
		className,
		scrollDirection = 'y',
		smoothScroll = false,
		...otherProps
	} = useContextSystem( props, 'Scrollable' );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.Scrollable,
				styles.scrollableScrollbar,
				smoothScroll && styles.smoothScroll,
				scrollDirection === 'x' && styles.scrollX,
				scrollDirection === 'y' && styles.scrollY,
				scrollDirection === 'auto' && styles.scrollAuto,
				className
			),
		[ className, cx, scrollDirection, smoothScroll ]
	);

	return { ...otherProps, className: classes };
}
