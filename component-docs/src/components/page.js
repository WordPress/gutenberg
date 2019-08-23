/**
 * External dependencies
 */
import React from 'react';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import FadeIn from './fade-in';
import { useRouter, useScrollToTop } from '../utils/hooks';

export default function Page( props ) {
	const { location } = useRouter();
	const { children, isLoaded } = props;

	useScrollToTop( location.pathname );

	return (
		<FadeIn isLoaded={ isLoaded }>
			<PageUI>{ children }</PageUI>
		</FadeIn>
	);
}

const PageUI = styled.div`
	position: relative;
`;
