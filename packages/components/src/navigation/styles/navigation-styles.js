/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { G2, UI } from '../../utils/colors-values';
import Button from '../../button';
import { Text } from '../../text';
import { reduceMotion, rtl } from '../../utils';
import { space } from '../../ui/utils/space';

export const NavigationUI = styled.div`
	width: 100%;
	background-color: ${ G2.darkGray.primary };
	box-sizing: border-box;
	color: #f0f0f0;
	padding: 0 ${ space( 4 ) };
	overflow: hidden;
`;

export const MenuUI = styled.div`
	margin-top: ${ space( 6 ) };
	margin-bottom: ${ space( 6 ) };
	display: flex;
	flex-direction: column;
	ul {
		padding: 0;
		margin: 0;
		list-style: none;
	}
	.components-navigation__back-button {
		margin-bottom: ${ space( 6 ) };
	}

	.components-navigation__group + .components-navigation__group {
		margin-top: ${ space( 6 ) };
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

export const MenuTitleUI = styled.div`
	overflow: hidden;
	width: 100%;
`;

export const MenuTitleHeadingUI = styled( Text )`
	align-items: center;
	color: ${ G2.gray[ 100 ] };
	display: flex;
	justify-content: space-between;
	margin-bottom: ${ space( 2 ) };
	padding: ${ () =>
		isRTL()
			? `${ space( 1 ) } ${ space( 4 ) } ${ space( 1 ) } ${ space( 3 ) }`
			: `${ space( 1 ) } ${ space( 3 ) } ${ space( 1 ) } ${ space(
					4
			  ) }` };
`;

export const MenuTitleActionsUI = styled.span`
	height: ${ space( 6 ) }; // 24px, same height as the buttons inside

	.components-button.is-small {
		color: ${ G2.lightGray.ui };
		margin-right: ${ space( 1 ) }; // Avoid hiding the focus outline
		padding: 0;

		&:active:not( :disabled ) {
			background: none;
			color: ${ G2.gray[ 200 ] };
		}
		&:hover:not( :disabled ) {
			box-shadow: none;
			color: ${ G2.gray[ 200 ] };
		}
	}
`;

export const MenuTitleSearchUI = styled.div`
	padding: 0;
	position: relative;

	input {
		height: ${ space( 9 ) }; // 36px, same height as MenuTitle
		margin-bottom: ${ space( 2 ) };
		padding-left: ${ space( 8 ) }; // Leave room for the search icon
		padding-right: ${ space(
			8
		) }; // Leave room for the close search button

		&::-webkit-search-decoration,
		&::-webkit-search-cancel-button,
		&::-webkit-search-results-button,
		&::-webkit-search-results-decoration {
			-webkit-appearance: none;
		}
	}

	> svg {
		left: ${ space( 1 ) };
		position: absolute;
		top: 6px;
	}

	.components-button.is-small {
		height: 30px;
		padding: 0;
		position: absolute;
		right: ${ space( 2 ) };
		top: 3px;

		&:active:not( :disabled ) {
			background: none;
		}
		&:hover:not( :disabled ) {
			box-shadow: none;
		}
	}
`;

export const GroupTitleUI = styled( Text )`
	margin-top: ${ space( 2 ) };
	padding: ${ () =>
		isRTL()
			? `${ space( 1 ) } ${ space( 4 ) } ${ space( 1 ) } 0`
			: `${ space( 1 ) } 0 ${ space( 1 ) } ${ space( 4 ) }` };
	text-transform: uppercase;
	color: ${ G2.gray[ 100 ] };
`;

export const ItemBaseUI = styled.li`
	border-radius: 2px;
	color: ${ G2.lightGray.ui };
	margin-bottom: 0;

	button,
	a.components-button,
	a {
		width: 100%;
		color: ${ G2.lightGray.ui };
		padding: ${ space( 2 ) } ${ space( 4 ) }; /* 8px 16px */
		${ rtl( { textAlign: 'left' }, { textAlign: 'right' } ) }

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

export const ItemUI = styled.div`
	display: flex;
	align-items: center;
	height: auto;
	min-height: 40px;
	margin: 0;
	padding: ${ space( 1.5 ) } ${ space( 4 ) };
	font-weight: 400;
	line-height: 20px;
	width: 100%;
	color: ${ G2.lightGray.ui };
`;

export const ItemBadgeUI = styled.span`
	margin-left: ${ () => ( isRTL() ? '0' : space( 2 ) ) };
	margin-right: ${ () => ( isRTL() ? space( 2 ) : '0' ) };
	display: inline-flex;
	padding: ${ space( 1 ) } ${ space( 3 ) };
	border-radius: 2px;
	animation: fade-in 250ms ease-out;

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	${ reduceMotion( 'animation' ) };
`;

export const ItemTitleUI = styled( Text )`
	${ () => ( isRTL() ? 'margin-left: auto;' : 'margin-right: auto;' ) }
	font-size: 14px;
	line-height: 20px;
	color: inherit;
`;
