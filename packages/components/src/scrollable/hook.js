/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../ui/context';
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 */
/* eslint-enable jsdoc/valid-types */
export function useScrollable( props ) {
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
