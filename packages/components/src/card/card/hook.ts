/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useSurface } from '../../surface';
import * as styles from '../styles';
import { useCx } from '../../utils/hooks/use-cx';
import type { Props } from '../types';

type CardProps = WordPressComponentProps< Props, 'div' >;

function useDeprecatedProps( {
	elevation,
	isElevated,
	...otherProps
}: CardProps ) {
	const propsToReturn: Omit< CardProps, 'isElevated' > = {
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

export function useCard( props: CardProps ) {
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
	}, [ className, cx, isBorderless, isRounded ] );

	const surfaceProps = useSurface( { ...otherProps, className: classes } );

	return {
		...surfaceProps,
		elevation,
		isBorderless,
		isRounded,
		size,
	};
}
