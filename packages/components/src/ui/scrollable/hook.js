/**
 * External dependencies
 */
import { cx } from 'emotion';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import * as styles from './styles';

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('../context').PolymorphicComponentProps<import('./types').Props, 'div'>} props
 */
/* eslint-enable jsdoc/valid-types */
export function useScrollable( props ) {
	const {
		className,
		scrollDirection = 'y',
		smoothScroll = false,
		...otherProps
	} = useContextSystem( props, 'Scrollable' );

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
		[ className, scrollDirection, smoothScroll ]
	);

	return { ...otherProps, className: classes };
}
