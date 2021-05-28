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

/**
 * @param {import('../context').PolymorphicComponentProps<import('./types').Props, 'div'>} props
 */
export function useSurface( props ) {
	const {
		backgroundSize = 12,
		border,
		borderBottom,
		borderLeft,
		borderRight,
		borderTop,
		className,
		variant = 'primary',
		...otherProps
	} = useContextSystem( props, 'Surface' );

	const classes = useMemo( () => {
		const sx = {};

		sx.borders = styles.getBorders( {
			border,
			borderBottom,
			borderLeft,
			borderRight,
			borderTop,
		} );

		return cx(
			styles.Surface,
			sx.borders,
			styles.getVariant(
				variant,
				`${ backgroundSize }px`,
				`${ backgroundSize - 1 }px`
			),
			className
		);
	}, [
		backgroundSize,
		border,
		borderBottom,
		borderLeft,
		borderRight,
		borderTop,
		className,
		variant,
	] );

	return { ...otherProps, className: classes };
}
