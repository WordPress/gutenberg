/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, CSSObject } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { Props } from './types';
import { CONFIG, reduceMotion } from '../utils';

const getBoxShadow = ( value: number ) => {
	const boxShadowColor = `rgba(0 ,0, 0, ${ value / 20 })`;
	return `0 ${ value }px ${ value * 2 }px 0
	${ boxShadowColor }`;
};

const renderBoxShadow = ( { value = 0 }: Props ) =>
	css( { boxShadow: getBoxShadow( value ) } );

const renderTransition = () =>
	css( {
		transition: `box-shadow ${ CONFIG.transitionDuration }
${ CONFIG.transitionTimingFunction }`,
	} );

const renderBorderRadius = ( { borderRadius }: Props ) =>
	css( { borderRadius } );

const renderOffset = ( { offset = 0 }: Props ) =>
	css( { bottom: offset, left: offset, right: offset, top: offset } );

const renderHoverActiveFocus = ( {
	isInteractive,
	active,
	hover,
	focus,
	value = 0,
}: Props ) => {
	let hoverValue: number | undefined =
		typeof hover !== 'undefined' ? hover : value * 2;
	let activeValue: number | undefined =
		typeof active !== 'undefined' ? active : value / 2;

	if ( ! isInteractive ) {
		hoverValue = typeof hover !== 'undefined' ? hover : undefined;
		activeValue = typeof active !== 'undefined' ? active : undefined;
	}

	const cssObj: CSSObject = {};

	if ( typeof hoverValue !== 'undefined' ) {
		cssObj[ '*:hover > &' ] = {
			boxShadow: getBoxShadow( hoverValue ),
		};
	}

	if ( typeof activeValue !== 'undefined' ) {
		cssObj[ '*:active > &' ] = {
			boxShadow: getBoxShadow( activeValue ),
		};
	}

	if ( typeof focus !== 'undefined' ) {
		cssObj[ '*focus > &' ] = {
			boxShadow: getBoxShadow( focus ),
		};
	}

	return css( cssObj );
};

export const ElevationWrapper = styled.div< Props >`
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
