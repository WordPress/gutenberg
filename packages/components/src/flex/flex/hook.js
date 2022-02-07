/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import { useResponsiveValue } from '../../ui/utils/use-responsive-value';
import { space } from '../../ui/utils/space';
import * as styles from '../styles';
import { useCx, rtl } from '../../utils';

/**
 *
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').FlexProps, 'div'>} props
 * @return {import('../../ui/context').WordPressComponentProps<import('../types').FlexProps, 'div'>} Props with the deprecated props removed.
 */
function useDeprecatedProps( { isReversed, ...otherProps } ) {
	if ( typeof isReversed !== 'undefined' ) {
		deprecated( 'Flex isReversed', {
			alternative: 'Flex direction="row-reverse" or "column-reverse"',
			since: '5.9',
		} );
		return {
			...otherProps,
			direction: isReversed ? 'row-reverse' : 'row',
		};
	}

	return otherProps;
}

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').FlexProps, 'div'>} props
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
	} = useContextSystem( useDeprecatedProps( props ), 'Flex' );

	const directionAsArray = Array.isArray( directionProp )
		? directionProp
		: [ directionProp ];
	const direction = useResponsiveValue( directionAsArray );

	const isColumn =
		typeof direction === 'string' && !! direction.includes( 'column' );
	const isReverse =
		typeof direction === 'string' && direction.includes( 'reverse' );

	const cx = useCx();

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

		/**
		 * Workaround to optimize DOM rendering.
		 * We'll enhance alignment with naive parent flex assumptions.
		 *
		 * Trade-off:
		 * Far less DOM less. However, UI rendering is not as reliable.
		 */
		sx.Items = css`
			> * + *:not( marquee ) {
				margin-top: ${ isColumn ? space( gap ) : undefined };
				${ rtl( {
					marginLeft:
						! isColumn && ! isReverse ? space( gap ) : undefined,
					marginRight:
						! isColumn && isReverse ? space( gap ) : undefined,
				} )() }
			}
		`;

		sx.WrapItems = css`
			> *:not( marquee ) {
				margin-bottom: ${ space( gap ) };
				${ rtl( {
					marginLeft:
						! isColumn && isReverse ? space( gap ) : undefined,
					marginRight:
						! isColumn && ! isReverse ? space( gap ) : undefined,
				} )() }
			}

			> *:last-child:not( marquee ) {
				${ rtl( {
					marginLeft: ! isColumn && isReverse ? 0 : undefined,
					marginRight: ! isColumn && ! isReverse ? 0 : undefined,
				} )() }
			}
		`;

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
		cx,
		direction,
		expanded,
		gap,
		isColumn,
		isReverse,
		justify,
		wrap,
		rtl.watch(),
	] );

	return { ...otherProps, className: classes, isColumn };
}
