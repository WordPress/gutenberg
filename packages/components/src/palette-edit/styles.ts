/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Button from '../button';
import { Heading } from '../heading';
import { space } from '../utils/space';
import { COLORS, CONFIG } from '../utils';
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
		border-radius: ${ CONFIG.radiusXSmall };
		${ Input }${ Input }${ Input }${ Input } {
			height: ${ space( 8 ) };
		}
		${ InputBackdropUI }${ InputBackdropUI }${ InputBackdropUI } {
			border-color: transparent;
			box-shadow: none;
		}
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

export const PaletteEditContents = styled( View )`
	margin-top: ${ space( 2 ) };
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
