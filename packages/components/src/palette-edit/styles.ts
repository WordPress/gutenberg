/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import Button from '../button';
import { Heading } from '../heading';
import { HStack } from '../h-stack';
import { space } from '../utils/space';
import { COLORS, CONFIG, font } from '../utils';
import { View } from '../view';
import InputControl from '../input-control';
import {
	Container as InputControlContainer,
	Input,
	BackdropUI as InputBackdropUI,
} from '../input-control/styles/input-control-styles';
import ColorIndicator from '../color-indicator';

export const IndicatorStyled = styled( ColorIndicator )`
	&& {
		flex-shrink: 0;
		width: ${ space( 6 ) };
		height: ${ space( 6 ) };
	}
`;

export const NameInputControl = styled( InputControl )`
	${ InputControlContainer } {
		background: ${ COLORS.gray[ 100 ] };
		border-radius: ${ CONFIG.controlBorderRadius };
		${ Input }${ Input }${ Input }${ Input } {
			height: ${ space( 8 ) };
		}
		${ InputBackdropUI }${ InputBackdropUI }${ InputBackdropUI } {
			border-color: transparent;
			box-shadow: none;
		}
	}
`;

const buttonStyleReset = ( {
	as,
}: {
	as: React.ComponentProps< typeof View >[ 'as' ];
} ) => {
	if ( as === 'button' ) {
		return css`
			display: flex;
			align-items: center;
			width: 100%;
			appearance: none;
			background: transparent;
			border: none;
			border-radius: 0;
			padding: 0;
			cursor: pointer;

			&:hover {
				color: ${ COLORS.theme.accent };
			}
		`;
	}
	return null;
};

export const PaletteItem = styled( View )`
	${ buttonStyleReset }

	padding-block: 3px;
	padding-inline-start: ${ space( 3 ) };
	border: 1px solid ${ CONFIG.surfaceBorderColor };
	border-bottom-color: transparent;
	font-size: ${ font( 'default.fontSize' ) };

	&:focus-visible {
		border-color: transparent;
		box-shadow: 0 0 0 var( --wp-admin-border-width-focus )
			${ COLORS.theme.accent };
		// Windows high contrast mode.
		outline: 2px solid transparent;
		outline-offset: 0;
	}

	border-top-left-radius: ${ CONFIG.controlBorderRadius };
	border-top-right-radius: ${ CONFIG.controlBorderRadius };

	& + & {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	&:last-child {
		border-bottom-left-radius: ${ CONFIG.controlBorderRadius };
		border-bottom-right-radius: ${ CONFIG.controlBorderRadius };
		border-bottom-color: ${ CONFIG.surfaceBorderColor };
	}

	&.is-selected + & {
		border-top-color: transparent;
	}
	&.is-selected {
		border-color: ${ COLORS.theme.accent };
	}
`;

export const NameContainer = styled.div`
	line-height: ${ space( 8 ) };
	margin-left: ${ space( 2 ) };
	margin-right: ${ space( 2 ) };
	white-space: nowrap;
	overflow: hidden;
`;

export const PaletteHeading = styled( Heading )`
	text-transform: uppercase;
	line-height: ${ space( 6 ) };
	font-weight: 500;
	&&& {
		font-size: 11px;
		margin-bottom: 0;
	}
`;

export const PaletteActionsContainer = styled( View )`
	height: ${ space( 6 ) };
	display: flex;
`;

export const PaletteHStackHeader = styled( HStack )`
	margin-bottom: ${ space( 2 ) };
`;

export const PaletteEditStyles = styled( View )`
	&&& {
		.components-button.has-icon {
			min-width: 0;
			padding: 0;
		}
	}
`;

export const DoneButton = styled( Button )`
	&& {
		color: ${ COLORS.theme.accent };
	}
`;

export const RemoveButton = styled( Button )`
	&& {
		margin-top: ${ space( 1 ) };
	}
`;
