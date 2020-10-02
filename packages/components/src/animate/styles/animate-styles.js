/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import * as animations from './animate-keyframe-styles';
import { reduceMotion } from '../../utils';
import { getRTLSafeTranslateX, getRTLSafeXAxis } from './utils';

export const AppearingWrapper = styled.div`
	animation: ${ animations.appear } 0.1s cubic-bezier( 0, 0, 0.2, 1 ) 0s;
	animation-fill-mode: forwards;

	${ reduceMotion( 'animation' ) }
    
	transform-origin: ${ ( p ) => p.yAxis } ${ getRTLSafeXAxis };
`;

export const SlidingWrapper = styled.div`
	animation: ${ animations.slideIn } 0.1s cubic-bezier( 0, 0, 0.2, 1 );
	animation-fill-mode: forwards;

	${ reduceMotion( 'animation' ) }

	transform: translateX( ${ getRTLSafeTranslateX } );
`;

export const LoadingWrapper = styled.div`
	animation: ${ animations.loading } 1.6s ease-in-out infinite;
`;
