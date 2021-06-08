/**
 * External dependencies
 */
import { cx } from 'emotion';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import { useSurface } from '../../surface';
import * as styles from '../styles';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
 */
function useDeprecatedProps( { elevation, isElevated, ...otherProps } ) {
	let computedElevation = elevation;

	if ( isElevated ) {
		deprecated( 'Card isElevated prop', {
			since: '5.9',
			alternative: 'elevation',
		} );
		computedElevation ??= 2;
	}

	return {
		...otherProps,
		isElevated,
		elevation: computedElevation,
	};
}

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
 */
export function useCard( props ) {
	const {
		className,
		elevation = 2,
		isBorderless = false,
		isRounded = true,
		size = 'medium',
		...otherProps
	} = useContextSystem( useDeprecatedProps( props ), 'Card' );

	const classes = useMemo( () => {
		return cx(
			styles.Card,
			isBorderless && styles.boxShadowless,
			isRounded && styles.rounded,
			'components-card',
			className
		);
	}, [ className, isBorderless, isRounded ] );

	const surfaceProps = useSurface( { ...otherProps, className: classes } );

	return {
		...surfaceProps,
		elevation,
		isBorderless,
		isRounded,
		size,
	};
}
