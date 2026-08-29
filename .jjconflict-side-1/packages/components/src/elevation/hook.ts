import clsx from 'clsx';
import type { CSSProperties } from 'react';
import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import { isValueDefined } from '../utils/values';
import type { ElevationProps } from './types';
import styles from './style.module.scss';

const BORDER_RADIUS_KEYWORDS = new Set( [
	'inherit',
	'initial',
	'unset',
	'revert',
	'revert-layer',
] );

export function getBoxShadow( value: number ) {
	const boxShadowColor = `rgba(0, 0, 0, ${ value / 20 })`;
	const boxShadow = `0 ${ value }px ${ value * 2 }px 0
	${ boxShadowColor }`;

	return boxShadow;
}

function hasValidShadow( value: number | undefined ): value is number {
	// A negative blur invalidates the old declaration. Do not let a custom
	// property turn it into a winning declaration that clears the prior shadow.
	return isValueDefined( value ) && Number.isFinite( value ) && value >= 0;
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
		style,
		value = 0,
		...otherProps
	} = useContextSystem( props, 'Elevation' );

	const hoverValue = hover ?? ( isInteractive ? value * 2 : undefined );
	const activeValue = active ?? ( isInteractive ? value / 2 : undefined );
	const radiusValue =
		typeof borderRadius === 'number' ? `${ borderRadius }px` : borderRadius;
	const radiusKeyword =
		typeof borderRadius === 'string' &&
		BORDER_RADIUS_KEYWORDS.has( borderRadius.trim().toLowerCase() )
			? borderRadius.trim().toLowerCase()
			: undefined;

	const elevationStyle: CSSProperties = {
		'--wp-components-elevation-border-radius': radiusKeyword
			? undefined
			: radiusValue,
		'--wp-components-elevation-offset': `${ offset }px`,
		'--wp-components-elevation-shadow': hasValidShadow( value )
			? getBoxShadow( value )
			: undefined,
		'--wp-components-elevation-hover-shadow': hasValidShadow( hoverValue )
			? getBoxShadow( hoverValue )
			: undefined,
		'--wp-components-elevation-focus-shadow': hasValidShadow( focus )
			? getBoxShadow( focus )
			: undefined,
		'--wp-components-elevation-active-shadow': hasValidShadow( activeValue )
			? getBoxShadow( activeValue )
			: undefined,
		...style,
	};

	return {
		...otherProps,
		className: clsx(
			styles.elevation,
			{
				[ styles[ 'has-shadow' ] ]: hasValidShadow( value ),
				[ styles[ 'has-hover' ] ]: hasValidShadow( hoverValue ),
				[ styles[ 'has-focus' ] ]: hasValidShadow( focus ),
				[ styles[ 'has-active' ] ]: hasValidShadow( activeValue ),
			},
			radiusKeyword && styles[ `border-radius-${ radiusKeyword }` ],
			className
		),
		style: elevationStyle,
		'aria-hidden': true,
	};
}
