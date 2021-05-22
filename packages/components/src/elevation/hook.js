/**
 * External dependencies
 */
import { css, cx } from 'emotion';
import { isNil } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../ui/context';
import * as styles from './styles';
import CONFIG from '../utils/config-values';

/**
 * @param {number} value
 * @return {string} The box shadow value.
 */
export function getBoxShadow( value ) {
	const boxShadowColor = `rgba(0 ,0, 0, ${ value / 20 })`;
	const boxShadow = `0 ${ value }px ${ value * 2 }px 0
	${ boxShadowColor }`;

	return boxShadow;
}

/**
 * @param {import('../ui/context').PolymorphicComponentProps<import('./types').Props, 'div'>} props
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

		const transition = `box-shadow ${ CONFIG.transitionDuration } ${ CONFIG.transitionTimingFunction }`;

		const sx = {};

		sx.Base = css( {
			borderRadius,
			bottom: offset,
			boxShadow: getBoxShadow( value ),
			opacity: CONFIG.elevationIntensity,
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
