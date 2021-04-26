/**
 * External dependencies
 */
import { css, cx, getBoxShadow, ui } from '@wp-g2/styles';
import { isNil } from 'lodash';

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
export function useElevation( props ) {
	const {
		active,
		borderRadius = 'inherit',
		className,
		focus,
		hover,
		isInteractive = false,
		offset = 0,
		value = 0,
		...otherProps
	} = useContextSystem( props, 'Elevation' );

	const classes = useMemo( () => {
		/** @type {number | undefined} */
		let hoverValue = ! isNil( hover ) ? hover : value * 2;
		/** @type {number | undefined} */
		let activeValue = ! isNil( active ) ? active : value / 2;

		if ( ! isInteractive ) {
			hoverValue = ! isNil( hover ) ? hover : undefined;
			activeValue = ! isNil( active ) ? active : undefined;
		}

		const transition = `box-shadow ${ ui.get(
			'transitionDuration'
		) } ${ ui.get( 'transitionTimingFunction' ) }`;

		const sx = {};

		sx.Base = css( {
			borderRadius,
			bottom: offset,
			boxShadow: getBoxShadow( value ),
			opacity: ui.get( 'elevationIntensity' ),
			left: offset,
			right: offset,
			top: offset,
			transition,
		} );

		if ( ! isNil( hoverValue ) ) {
			sx.hover = css`
				*:hover > & {
					box-shadow: ${ getBoxShadow( hoverValue ) };
				}
			`;
		}

		if ( ! isNil( activeValue ) ) {
			sx.active = css`
				*:active > & {
					box-shadow: ${ getBoxShadow( activeValue ) };
				}
			`;
		}

		if ( ! isNil( focus ) ) {
			sx.focus = css`
				*:focus > & {
					box-shadow: ${ getBoxShadow( focus ) };
				}
			`;
		}

		return cx(
			styles.Elevation,
			sx.Base,
			sx.hover && sx.hover,
			sx.focus && sx.focus,
			sx.active && sx.active,
			className
		);
	}, [
		active,
		borderRadius,
		className,
		focus,
		hover,
		isInteractive,
		offset,
		value,
	] );

	return { ...otherProps, className: classes, 'aria-hidden': true };
}
