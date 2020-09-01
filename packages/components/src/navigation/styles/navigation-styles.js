/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { LIGHT_GRAY } from '../../utils/colors-values';
import Text from '../../text';

export const Root = styled.div`
	width: 100%;
`;

export const MenuUI = styled.div`
	margin-top: 24px;
	display: flex;
	flex-direction: column;
	ul {
		padding: 0;
		margin: 0;
		list-style: none;
	}
`;

export const MenuTitleUI = styled( Text )`
	padding: 4px 0 4px 16px;
	margin-bottom: 8px;
`;

export const MenuItemUI = styled.li`
	button,
	a {
		padding-left: 16px;
		padding-right: 16px;
		width: 100%;
	}
	&.is-active {
		background-color: ${ LIGHT_GRAY[ 300 ] };
	}
`;

export const MenuItemTitleUI = styled( Text )`
	margin-right: auto;
`;

export const BadgeUI = styled.span`
	margin-left: 8px;
	display: inline-flex;
	padding: 4px 12px;
	border-radius: 2px;
`;
