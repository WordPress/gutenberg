/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../ui/context';
import * as styles from './styles';
import { CONFIG, reduceMotion } from '../utils';
import { useCx } from '../utils/hooks/use-cx';
import { isValueDefined } from '../utils/values';

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
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
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

	const cx = useCx();

	const classes = useMemo( () => {
		/** @type {number | undefined} */
		let hoverValue = isValueDefined( hover ) ? hover : value * 2;
		/** @type {number | undefined} */
		let activeValue = isValueDefined( active ) ? active : value / 2;

		if ( ! isInteractive ) {
			hoverValue = isValueDefined( hover ) ? hover : undefined;
			activeValue = isValueDefined( active ) ? active : undefined;
		}

		const transition = `box-shadow ${ CONFIG.transitionDuration } ${ CONFIG.transitionTimingFunction }`;

		const sx = {};

		sx.Base = css(
			{
				borderRadius,
				bottom: offset,
				boxShadow: getBoxShadow( value ),
				opacity: CONFIG.elevationIntensity,
				left: offset,
				right: offset,
				top: offset,
				transition,
			},
			reduceMotion( 'transition' )
		);

		if ( isValueDefined( hoverValue ) ) {
			sx.hover = css`
				*:hover > & {
					box-shadow: ${ getBoxShadow( hoverValue ) };
				}
			`;
		}

		if ( isValueDefined( activeValue ) ) {
			sx.active = css`
				*:active > & {
					box-shadow: ${ getBoxShadow( activeValue ) };
				}
			`;
		}

		if ( isValueDefined( focus ) ) {
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
		cx,
		focus,
		hover,
		isInteractive,
		offset,
		value,
	] );

	return { ...otherProps, className: classes, 'aria-hidden': true };
}
