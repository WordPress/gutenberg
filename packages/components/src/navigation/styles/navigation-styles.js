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
import { reduceMotion, space, rtl } from '../../utils';

export const NavigationUI = styled.div`
	width: 100%;
	background-color: ${ G2.darkGray.primary };
	box-sizing: border-box;
	color: #f0f0f0;
	display: grid;
	grid-template: 1fr/1fr;
	> * {
		padding: 0 ${ space( 2 ) };
		grid-area: 1/1;
	}
	> .components-animate__slide-out {
		pointer-events: none;
	}
`;

export const MenuUI = styled.div`
	margin-top: ${ space( 3 ) };
	margin-bottom: ${ space( 3 ) };
	display: flex;
	flex-direction: column;
	ul {
		padding: 0;
		margin: 0;
		list-style: none;
	}
	.components-navigation__back-button {
		margin-bottom: ${ space( 3 ) };
	}

	.components-navigation__group + .components-navigation__group {
		margin-top: ${ space( 3 ) };
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
	margin-bottom: ${ space( 1 ) };
	padding: ${ () =>
		isRTL()
			? `${ space( 0.5 ) } ${ space( 2 ) } ${ space( 0.5 ) } ${ space(
					1.5
			  ) }`
			: `${ space( 0.5 ) } ${ space( 1.5 ) } ${ space( 0.5 ) } ${ space(
					2
			  ) }` };
`;

export const MenuTitleActionsUI = styled.span`
	height: ${ space( 3 ) }; // 24px, same height as the buttons inside

	.components-button.is-small {
		color: ${ G2.lightGray.ui };
		margin-right: ${ space( 0.5 ) }; // Avoid hiding the focus outline
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
		height: ${ space( 4.5 ) }; // 36px, same height as MenuTitle
		margin-bottom: ${ space( 1 ) };
		padding-left: ${ space( 4 ) }; // Leave room for the search icon
		padding-right: ${ space(
			4
		) }; // Leave room for the close search button

		&::-webkit-search-decoration,
		&::-webkit-search-cancel-button,
		&::-webkit-search-results-button,
		&::-webkit-search-results-decoration {
			-webkit-appearance: none;
		}
	}

	> svg {
		left: ${ space( 0.5 ) };
		position: absolute;
		top: 6px;
	}

	.components-button.is-small {
		height: 30px;
		padding: 0;
		position: absolute;
		right: ${ space( 1 ) };
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
	margin-top: ${ space( 1 ) };
	padding: ${ () =>
		isRTL()
			? `${ space( 0.5 ) } ${ space( 2 ) } ${ space( 0.5 ) } 0`
			: `${ space( 0.5 ) } 0 ${ space( 0.5 ) } ${ space( 2 ) }` };
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
		padding: ${ space( 1 ) } ${ space( 2 ) }; /* 8px 16px */
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
	padding: ${ space( 0.75 ) } ${ space( 2 ) };
	font-weight: 400;
	line-height: 20px;
	width: 100%;
	color: ${ G2.lightGray.ui };
`;

export const ItemBadgeUI = styled.span`
	margin-left: ${ () => ( isRTL() ? '0' : space( 1 ) ) };
	margin-right: ${ () => ( isRTL() ? space( 1 ) : '0' ) };
	display: inline-flex;
	padding: ${ space( 0.5 ) } ${ space( 1.5 ) };
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
