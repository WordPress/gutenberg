/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

const horizontalPadding = css`
	padding-left: 30px;
	padding-right: 30px;
`;

export const Root = styled.div`
	width: 272px;
	padding: 35px 0px;
`;

export const Menu = styled.ul`
	padding: 0;
	margin: 0 0 32px 0;
	display: flex;
	flex-direction: column;
`;

export const MenuItem = styled.li`
	display: flex;
	justify-content: space-between;
	button {
		width: 100%;
		padding-top: 8px;
		padding-bottom: 8px;
		${ horizontalPadding }
	}
	&.is-active span {
		border-bottom: 2px solid var( --wp-admin-theme-color );
	}
`;
