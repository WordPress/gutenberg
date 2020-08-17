/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { LIGHT_GRAY } from '../../utils/colors-values';
import Text from '../../text';

const horizontalPadding = '30px';

export const Root = styled.div`
	width: 272px;
	padding: 35px 0px;
	> *:not( .components-navigation__menu ) {
		margin-left: ${ horizontalPadding };
		margin-right: ${ horizontalPadding };
	}
`;

export const Menu = styled.ul`
	padding: 0;
	margin: 0 0 32px 0;
	display: flex;
	flex-direction: column;
`;

export const MenuItemText = styled( Text )`
	margin-right: auto;
`;

export const MenuItem = styled.li`
	display: flex;
	justify-content: space-between;
	button {
		width: 100%;
		padding-top: 8px;
		padding-bottom: 8px;
		padding-left: ${ horizontalPadding };
		padding-right: ${ horizontalPadding };
	}
	svg {
		margin-left: 8px;
	}
	&.is-active ${ MenuItemText } {
		border-bottom: 2px solid var( --wp-admin-theme-color );
	}
`;

export const BadgeUI = styled.span`
	margin-left: 8px;
	display: inline-flex;
	padding: 4px 12px;
	border-radius: 2px;
	background-color: ${ LIGHT_GRAY[ 300 ] };
`;
