/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, CSSObject } from '@emotion/react';
import type { Required } from 'utility-types';

/**
 * Internal dependencies
 */
import type { Props } from './types';
import { CONFIG, reduceMotion } from '../utils';

export type ElevationViewProps = Required< Props >;

const getBoxShadow = ( value: number ) => {
	const boxShadowColor = `rgba(0 ,0, 0, ${ value / 20 })`;
	return `0 ${ value }px ${ value * 2 }px 0
	${ boxShadowColor }`;
};

const renderBoxShadow = ( { value }: ElevationViewProps ) =>
	css( { boxShadow: getBoxShadow( value ) } );

const renderTransition = () =>
	css( {
		transition: `box-shadow ${ CONFIG.transitionDuration }
${ CONFIG.transitionTimingFunction }`,
	} );

const renderBorderRadius = ( { borderRadius }: ElevationViewProps ) =>
	css( { borderRadius } );

const renderOffset = ( { offset }: ElevationViewProps ) =>
	css( { bottom: offset, left: offset, right: offset, top: offset } );

const renderHoverActiveFocus = ( {
	isInteractive,
	active,
	hover,
	focus,
	value,
}: ElevationViewProps ) => {
	let hoverValue: number | null = hover !== null ? hover : value * 2;
	let activeValue: number | null = active !== null ? active : value / 2;

	if ( ! isInteractive ) {
		hoverValue = hover;
		activeValue = active;
	}

	const cssObj: CSSObject = {};

	if ( hoverValue !== null ) {
		cssObj[ '*:hover > &' ] = {
			boxShadow: getBoxShadow( hoverValue ),
		};
	}

	if ( activeValue !== null ) {
		cssObj[ '*:active > &' ] = {
			boxShadow: getBoxShadow( activeValue ),
		};
	}

	if ( focus !== null ) {
		cssObj[ '*focus > &' ] = {
			boxShadow: getBoxShadow( focus ),
		};
	}

	return css( cssObj );
};

const DO_NOT_FORWARD = [
	'value',
	'offset',
	'hover',
	'active',
	'focus',
	'borderRadius',
	'isInteractive',
];

export const ElevationView = styled( 'div', {
	shouldForwardProp: ( propName ) =>
		! DO_NOT_FORWARD.includes( propName as string ),
} )< ElevationViewProps >`
	background: transparent;
	display: block;
	margin: 0 !important;
	pointer-events: none;
	position: absolute;
	will-change: box-shadow;
	opacity: ${ CONFIG.elevationIntensity };
	${ renderTransition }
	${ reduceMotion( 'transition' ) }
	${ renderBoxShadow }
	${ renderBorderRadius }
	${ renderOffset }
	${ renderHoverActiveFocus }
`;
