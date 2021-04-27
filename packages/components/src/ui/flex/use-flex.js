/**
 * External dependencies
 */
import { css, cx } from 'emotion';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import { useResponsiveValue } from '../utils/use-responsive-value';
import { space } from '../utils/space';
import * as styles from './styles';

/**
 * @param {import('../context').ViewOwnProps<import('./types').FlexProps, 'div'>} props
 */
export function useFlex( props ) {
	const {
		align = 'center',
		className,
		direction: directionProp = 'row',
		expanded = true,
		gap = 2,
		justify = 'space-between',
		wrap = false,
		...otherProps
	} = useContextSystem( props, 'Flex' );

	const directionAsArray = Array.isArray( directionProp )
		? directionProp
		: [ directionProp ];
	const direction = useResponsiveValue( directionAsArray );

	const isColumn =
		typeof direction === 'string' && !! direction.includes( 'column' );
	const isReverse =
		typeof direction === 'string' && direction.includes( 'reverse' );

	const classes = useMemo( () => {
		const sx = {};

		sx.Base = css( {
			alignItems: isColumn ? 'normal' : align,
			flexDirection: direction,
			flexWrap: wrap ? 'wrap' : undefined,
			justifyContent: justify,
			height: isColumn && expanded ? '100%' : undefined,
			width: ! isColumn && expanded ? '100%' : undefined,
			marginBottom: wrap ? `calc(${ space( gap ) } * -1)` : undefined,
		} );

		sx.Items = css( {
			/**
			 * Workaround to optimize DOM rendering.
			 * We'll enhance alignment with naive parent flex assumptions.
			 *
			 * Trade-off:
			 * Far less DOM less. However, UI rendering is not as reliable.
			 */
			'> * + *:not(marquee)': {
				marginTop: isColumn ? space( gap ) : undefined,
				marginRight: ! isColumn && isReverse ? space( gap ) : undefined,
				marginLeft:
					! isColumn && ! isReverse ? space( gap ) : undefined,
			},
		} );

		sx.WrapItems = css( {
			'> *:not(marquee)': {
				marginBottom: space( gap ),
				marginLeft: ! isColumn && isReverse ? space( gap ) : undefined,
				marginRight:
					! isColumn && ! isReverse ? space( gap ) : undefined,
			},
			'> *:last-child:not(marquee)': {
				marginLeft: ! isColumn && isReverse ? 0 : undefined,
				marginRight: ! isColumn && ! isReverse ? 0 : undefined,
			},
		} );

		return cx(
			styles.Flex,
			sx.Base,
			wrap ? sx.WrapItems : sx.Items,
			isColumn ? styles.ItemsColumn : styles.ItemsRow,
			className
		);
	}, [
		align,
		className,
		direction,
		expanded,
		gap,
		isColumn,
		isReverse,
		justify,
		wrap,
	] );

	return { ...otherProps, className: classes };
}
