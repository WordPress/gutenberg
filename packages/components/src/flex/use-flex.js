/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { css, cx, ui, useResponsiveValue } from '@wp-g2/styles';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import * as styles from './styles';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FlexProps, 'div'>} props
 */
function getDirection( { isReversed, direction } ) {
	if ( typeof isReversed !== 'undefined' ) {
		deprecated( 'Flex isReversed', {
			alternative: 'Flex direction="row-reverse"',
			since: '10.4',
		} );
		if ( isReversed ) {
			return 'row-reverse';
		}

		return 'row';
	}

	return direction;
}

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FlexProps, 'div'>} props
 * @return {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FlexProps, 'div'>} Cleaned props
 */
function useDeprecatedProps( props ) {
	return {
		...props,
		direction: getDirection( props ),
	};
}

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FlexProps, 'div'>} props
 */
export function useFlex( props ) {
	const cleanedProps = useDeprecatedProps( props );
	const {
		align = 'center',
		className,
		direction: directionProp = 'row',
		expanded = true,
		gap = 2,
		justify = 'space-between',
		wrap = false,
		...otherProps
	} = useContextSystem( cleanedProps, 'Flex' );

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
			[ ui.createToken( 'flexGap' ) ]: ui.space( gap ),
			[ ui.createToken( 'flexItemDisplay' ) ]: isColumn
				? 'block'
				: undefined,
			alignItems: isColumn ? 'normal' : align,
			flexDirection: direction,
			flexWrap: wrap ? 'wrap' : undefined,
			justifyContent: justify,
			height: isColumn && expanded ? '100%' : undefined,
			width: ! isColumn && expanded ? '100%' : undefined,
			marginBottom: wrap ? `calc(${ ui.space( gap ) } * -1)` : undefined,
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
				marginTop: isColumn ? ui.space( gap ) : undefined,
				marginRight:
					! isColumn && isReverse ? ui.space( gap ) : undefined,
				marginLeft:
					! isColumn && ! isReverse ? ui.space( gap ) : undefined,
			},
		} );

		sx.WrapItems = css( {
			'> *:not(marquee)': {
				marginBottom: ui.space( gap ),
				marginLeft:
					! isColumn && isReverse ? ui.space( gap ) : undefined,
				marginRight:
					! isColumn && ! isReverse ? ui.space( gap ) : undefined,
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
