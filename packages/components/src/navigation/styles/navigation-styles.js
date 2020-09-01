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

export const MenuUI = styled.ul`
	padding: 0;
	margin: 0 0 32px 0;
	display: flex;
	flex-direction: column;
`;

export const MenuItemUI = styled.li`
	button {
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
