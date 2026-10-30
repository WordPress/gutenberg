import clsx from 'clsx';
import deprecated from '@wordpress/deprecated';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useSurface } from '../../surface';
import styles from '../style.module.scss';
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

	const classes = clsx(
		styles.card,
		{
			[ styles[ 'card-borderless' ] ]: isBorderless,
			[ styles[ 'is-rounded' ] ]: isRounded,
		},
		className
	);

	const surfaceProps = useSurface( { ...otherProps, className: classes } );

	return {
		...surfaceProps,
		elevation,
		isBorderless,
		isRounded,
		size,
	};
}
