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
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').Props, 'div'>} props
 */
function useDeprecatedProps( { elevation, isElevated, ...otherProps } ) {
	/**@type {import('../../ui/context').WordPressComponentProps<import('../types').Props, 'div'>} */
	const propsToReturn = {
		...otherProps,
	};
	let computedElevation = elevation;

	if ( isElevated ) {
		deprecated( 'Card isElevated prop', {
			since: '5.9',
			alternative: 'elevation',
		} );
		computedElevation ??= 2;
	}

	// The `elevation` prop should only be passed when it's not `undefined`,
	// otherwise it will override the value that gets derived from `useContextSystem`.
	if ( typeof computedElevation !== 'undefined' ) {
		propsToReturn.elevation = computedElevation;
	}

	return propsToReturn;
}

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').Props, 'div'>} props
 */
export function useCard( props ) {
	const {
		className,
		elevation = 0,
		isBorderless = false,
		isRounded = true,
		size = 'medium',
		...otherProps
	} = useContextSystem( useDeprecatedProps( props ), 'Card' );

	const cx = useCx();

	const classes = useMemo( () => {
		return cx(
			styles.Card,
			isBorderless && styles.boxShadowless,
			isRounded && styles.rounded,
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
