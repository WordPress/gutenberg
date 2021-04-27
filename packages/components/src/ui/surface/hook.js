/**
 * External dependencies
 */
import { css, cx, ui } from '@wp-g2/styles';

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
 * @param {import('../context').ViewOwnProps<import('./types').Props, 'div'>} props
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
			styles[ variant ],
			css( {
				[ ui.createToken( 'surfaceBackgroundSize' ) ]: ui.value.px(
					backgroundSize
				),
				[ ui.createToken(
					'surfaceBackgroundSizeDotted'
				) ]: ui.value.px( backgroundSize - 1 ),
			} ),
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
