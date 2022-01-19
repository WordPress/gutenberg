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
import InputControl from '../input-control';
import Item from '../item-group/item';
import {
	Container as InputControlContainer,
	Input,
	BackdropUI as InputBackdropUI,
} from '../input-control/styles/input-control-styles';
import CircularOptionPicker from '../circular-option-picker';

export const IndicatorStyled = styled( CircularOptionPicker.Option )`
	width: ${ space( 6 ) };
	height: ${ space( 6 ) };
	pointer-events: none;
`;

export const NameInputControl = styled( InputControl )`
	${ InputControlContainer } {
		background: ${ COLORS.gray[ 100 ] };
		border-radius: ${ CONFIG.controlBorderRadius }};
		${ Input }${ Input }${ Input }${ Input } {
			height: ${ space( 8 ) };
		}
		${ InputBackdropUI }${ InputBackdropUI }${ InputBackdropUI } {
			border-color: transparent;
			box-shadow: none;
		}
	}
`;

export const PaletteItem = styled( Item )`
	padding: 3px 0 3px ${ space( 3 ) };
	height: calc( 40px - ${ CONFIG.borderWidth } );
`;

export const NameContainer = styled.div`
	line-height: ${ space( 8 ) };
	margin-left: ${ space( 2 ) };
	margin-right: ${ space( 2 ) };
	white-space: nowrap;
	overflow: hidden;
	${ PaletteItem }:hover & {
		color: var( --wp-admin-theme-color, ${ COLORS.blue.wordpress[ 700 ] } );
	}
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
