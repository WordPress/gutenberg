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
import { useSurface } from '../surface';
import * as styles from './styles';

/**
 * @param {import('../context').PolymorphicComponentProps<import('./types').CardProps, 'div'>} props
 */
export function useCard( props ) {
	const {
		className,
		elevation = 2,
		isBorderless = false,
		isRounded = true,
		...otherProps
	} = useContextSystem( props, 'Card' );

	const classes = useMemo( () => {
		return cx(
			styles.Card,
			isBorderless && styles.borderless,
			isRounded && styles.rounded,
			className
		);
	}, [ className, isBorderless, isRounded ] );

	const surfaceProps = useSurface( { ...otherProps, className: classes } );

	return {
		...surfaceProps,
		elevation,
		isRounded,
	};
}
