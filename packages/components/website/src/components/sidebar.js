/**
 * External dependencies
 */
import React from 'react';
import styled from 'styled-components';

export default function Sidebar( props ) {
	const { children } = props;

	return (
		<SidebarUI>
			<BodyWrapper>
				<Body>{ children }</Body>
			</BodyWrapper>
		</SidebarUI>
	);
}

const SidebarUI = styled.div`
	border-right: 1px solid #eee;
	bottom: 0;
	left: 0;
	margin-top: var( --navHeight );
	width: 280px;
	position: fixed;
	top: 0;
`;

const BodyWrapper = styled.div`
	position: relative;
	display: flex;
	flex-flow: column;
	height: 100%;
`;

const Body = styled.div`
	padding-bottom: 10vh;
	height: 100%;
	min-height: 0;
	overflow-y: auto;
`;
