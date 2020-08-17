/**
 * External dependencies
 */
import styled from '@emotion/styled';

export const Root = styled.div`
	width: 100%;
`;

export const Menu = styled.ul`
	padding: 0;
	margin: 0 0 32px 0;
	display: flex;
	flex-direction: column;
`;

export const MenuItem = styled.li`
	button {
		width: 100%;
	}
	&.is-active span {
		border-bottom: 2px solid var( --wp-admin-theme-color );
	}
`;
