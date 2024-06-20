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
import { COLORS } from '../../utils/colors-values';
import Button from '../../button';
import { Text } from '../../text';
import { Heading } from '../../heading';
import { rtl } from '../../utils';
import { space } from '../../utils/space';

export const NavigationUI = styled.div`
	width: 100%;
	box-sizing: border-box;
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
		color: inherit;
		opacity: 0.7;

		&:hover:not( :disabled ) {
			opacity: 1;
			box-shadow: none;
			color: inherit;
		}

		&:active:not( :disabled ) {
			background: transparent;
			opacity: 1;
			color: inherit;
		}
	}
`;

export const MenuTitleUI = styled.div`
	overflow: hidden;
	width: 100%;
`;

export const MenuTitleSearchControlWrapper = styled.div`
	margin: 11px 0; // non-ideal hardcoding to maintain same height as Heading, could be improved
	padding: 1px; // so the focus border doesn't get cut off by the overflow hidden on MenuTitleUI
`;

export const MenuTitleActionsUI = styled.span`
	height: ${ space( 6 ) }; // 24px, same height as the buttons inside

	.components-button.is-small {
		color: inherit;
		opacity: 0.7;
		margin-right: ${ space( 1 ) }; // Avoid hiding the focus outline
		padding: 0;

		&:active:not( :disabled ) {
			background: none;
			opacity: 1;
			color: inherit;
		}
		&:hover:not( :disabled ) {
			box-shadow: none;
			opacity: 1;
			color: inherit;
		}
	}
`;

export const GroupTitleUI = styled( Heading )`
	min-height: ${ space( 12 ) };
	align-items: center;
	color: inherit;
	display: flex;
	justify-content: space-between;
	margin-bottom: ${ space( 2 ) };
	padding: ${ () =>
		isRTL()
			? `${ space( 1 ) } ${ space( 4 ) } ${ space( 1 ) } ${ space( 2 ) }`
			: `${ space( 1 ) } ${ space( 2 ) } ${ space( 1 ) } ${ space(
					4
			  ) }` };
`;

export const ItemBaseUI = styled.li`
	border-radius: 2px;
	color: inherit;
	margin-bottom: 0;

	> button,
	> a.components-button,
	> a {
		width: 100%;
		color: inherit;
		opacity: 0.7;
		padding: ${ space( 2 ) } ${ space( 4 ) }; /* 8px 16px */
		${ rtl( { textAlign: 'left' }, { textAlign: 'right' } ) }

		&:hover,
		&:focus:not( [aria-disabled='true'] ):active,
		&:active:not( [aria-disabled='true'] ):active {
			color: inherit;
			opacity: 1;
		}
	}

	&.is-active {
		background-color: ${ COLORS.theme.accent };
		color: ${ COLORS.white };

		> button,
		> a {
			color: ${ COLORS.white };
			opacity: 1;
		}
	}

	> svg path {
		color: ${ COLORS.gray[ 600 ] };
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
	color: inherit;
	opacity: 0.7;
`;

export const ItemIconUI = styled.span`
	display: flex;
	margin-right: ${ space( 2 ) };
`;

export const ItemBadgeUI = styled.span`
	margin-left: ${ () => ( isRTL() ? '0' : space( 2 ) ) };
	margin-right: ${ () => ( isRTL() ? space( 2 ) : '0' ) };
	display: inline-flex;
	padding: ${ space( 1 ) } ${ space( 3 ) };
	border-radius: 2px;

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media not ( prefers-reduced-motion ) {
		animation: fade-in 250ms ease-out;
	}
`;

export const ItemTitleUI = styled( Text )`
	${ () => ( isRTL() ? 'margin-left: auto;' : 'margin-right: auto;' ) }
	font-size: 14px;
	line-height: 20px;
	color: inherit;
`;
