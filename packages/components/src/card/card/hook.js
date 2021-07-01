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
import { cx } from '../../utils';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
 */
function useDeprecatedProps( { elevation, isElevated, ...otherProps } ) {
	/**@type {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} */
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
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
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

	const classes = useMemo( () => {
		return cx( 'components-card', className );
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
