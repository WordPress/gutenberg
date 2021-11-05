/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Button from '../button';
import { Heading } from '../heading';
import { HStack } from '../h-stack';
import { space } from '../ui/utils/space';
import { COLORS, CONFIG } from '../utils';
import { View } from '../view';
import ColorIndicator from '../color-indicator';
import InputControl from '../input-control';
import Item from '../item-group/item';
import {
	Container as InputControlContainer,
	Input,
	BackdropUI as InputBackdropUI,
} from '../input-control/styles/input-control-styles';

export const ColorIndicatorStyled = styled( ColorIndicator )`
	&& {
		display: block;
		border-radius: 50%;
		border: 0;
		height: ${ space( 6 ) };
		width: ${ space( 6 ) };
		margin-left: 0;
		padding: 0;
	}
`;

export const ColorNameInputControl = styled( InputControl )`
	${ InputControlContainer } {
		background: ${ COLORS.gray[ 100 ] };
		border-radius: 2px;
		${ Input }${ Input }${ Input }${ Input } {
			height: ${ space( 8 ) };
		}
		${ InputBackdropUI }${ InputBackdropUI }${ InputBackdropUI } {
			border-color: transparent;
			box-shadow: none;
		}
	}
`;

export const ColorItem = styled( Item )`
	padding: 3px 0 3px ${ space( 3 ) };
	height: calc( 40px - ${ CONFIG.borderWidth } );
`;

export const ColorNameContainer = styled.span`
	line-height: ${ space( 8 ) };
	margin-left: ${ space( 2 ) };
`;

export const ColorHeading = styled( Heading )`
	text-transform: uppercase;
	line-height: ${ space( 6 ) };
	font-weight: 500;
	&&& {
		font-size: 11px;
		margin-bottom: 0;
	}
`;

export const ColorActionsContainer = styled( View )`
	height: ${ space( 6 ) };
	display: flex;
`;

export const ColorHStackHeader = styled( HStack )`
	margin-bottom: ${ space( 2 ) };
`;

export const ColorEditStyles = styled( View )`
	&&& {
		.components-button.has-icon {
		min-width: 0;
		padding: 0;
	}
`;

export const DoneButton = styled( Button )`
	&& {
		color: ${ COLORS.ui.theme };
	}
`;

export const RemoveButton = styled( Button )`
	&& {
		margin-top: ${ space( 1 ) };
	}
`;
