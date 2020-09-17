/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { G2, UI } from '../../utils/colors-values';
import Button from '../../button';
import Text from '../../text';

export const NavigationUI = styled.div`
	width: 100%;
	background-color: ${ G2.darkGray.primary };
	color: #f0f0f0;
	padding: 8px;
	overflow: hidden;
`;

export const MenuUI = styled.div`
	margin-top: 24px;
	margin-bottom: 24px;
	display: flex;
	flex-direction: column;
	ul {
		padding: 0;
		margin: 0;
		list-style: none;
	}
`;

export const MenuBackButtonUI = styled( Button )`
	&.is-tertiary {
		color: ${ G2.lightGray.ui };

		&:hover:not( :disabled ) {
			color: #ddd;
			box-shadow: none;
		}

		&:active:not( :disabled ) {
			background: transparent;
			color: #ddd;
		}
	}
`;

export const MenuTitleUI = styled( Text )`
	padding: 4px 0 4px 16px;
	margin-bottom: 8px;
`;

export const GroupTitleUI = styled( Text )`
	margin-top: 8px;
	padding: 4px 0 4px 16px;
	text-transform: uppercase;
`;

export const ItemUI = styled.li`
	border-radius: 2px;
	color: ${ G2.lightGray.ui };

	button,
	a {
		padding-left: 16px;
		padding-right: 16px;
		width: 100%;
		color: ${ G2.lightGray.ui };

		&:hover,
		&:focus:not( [aria-disabled='true'] ):active,
		&:active:not( [aria-disabled='true'] ):active {
			color: #ddd;
		}
	}

	&.is-active {
		background-color: ${ UI.theme };
		color: ${ UI.textDark };

		button,
		a {
			color: ${ UI.textDark };
		}
	}

	svg path {
		color: ${ G2.lightGray.ui };
	}
`;

export const ItemBadgeUI = styled.span`
	margin-left: 8px;
	display: inline-flex;
	padding: 4px 12px;
	border-radius: 2px;
`;

export const ItemTitleUI = styled( Text )`
	margin-right: auto;
`;
