/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { isUndefined } from 'lodash';
/**
 * External dependencies
 */
import styled from 'styled-components';

export default function Fade( props ) {
	const { children, isLoaded } = props;
	const [ isReady, setReady ] = useState( isLoaded );

	useEffect( () => {
		window.requestAnimationFrame( () => {
			setReady( true );
		} );
		return () => {
			setReady( false );
		};
	}, [ setReady ] );

	const shouldFadeIn = isUndefined( isLoaded ) ? isReady : isLoaded;
	const className = shouldFadeIn ? 'is-ready' : '';

	return <FadeUI className={ className }>{ children }</FadeUI>;
}

const FadeUI = styled.div`
	opacity: 0;
	transition-delay: 0ms;
	transition-duration: 0ms;
	transition-property: opacity;
	transition-timing-function: linear;

	&.is-ready {
		opacity: 1;
		transition-duration: 200ms;
	}
`;
