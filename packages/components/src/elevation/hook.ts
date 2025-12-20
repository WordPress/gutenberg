/**
 * External dependencies
 */
import type { SerializedStyles } from '@emotion/react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import * as styles from './styles';
import { CONFIG } from '../utils';
import { useCx } from '../utils/hooks/use-cx';
import { isValueDefined } from '../utils/values';
import type { ElevationProps } from './types';

export function getBoxShadow( value: number ) {
	const boxShadowColor = `rgba(0, 0, 0, ${ value / 20 })`;
	const boxShadow = `0 ${ value }px ${ value * 2 }px 0
	${ boxShadowColor }`;

	return boxShadow;
}

export function useElevation(
	props: WordPressComponentProps< ElevationProps, 'div' >
) {
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
		let hoverValue: number | undefined = isValueDefined( hover )
			? hover
			: value * 2;
		let activeValue: number | undefined = isValueDefined( active )
			? active
			: value / 2;

		if ( ! isInteractive ) {
			hoverValue = isValueDefined( hover ) ? hover : undefined;
			activeValue = isValueDefined( active ) ? active : undefined;
		}

		const transition = `box-shadow ${ CONFIG.transitionDuration } ${ CONFIG.transitionTimingFunction }`;

		const sx: {
			Base?: SerializedStyles;
			hover?: SerializedStyles;
			active?: SerializedStyles;
			focus?: SerializedStyles;
		} = {};

		sx.Base = css(
			{
				borderRadius,
				bottom: offset,
				boxShadow: getBoxShadow( value ),
				opacity: CONFIG.elevationIntensity,
				left: offset,
				right: offset,
				top: offset,
			},
			css`
				@media not ( prefers-reduced-motion ) {
					transition: ${ transition };
				}
			`
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
			sx.hover,
			sx.focus,
			sx.active,
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
