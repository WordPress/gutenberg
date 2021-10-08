/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import NumberControl from '../number-control';
import InnerSelectControl from '../select-control';
import InnerRangeControl from '../range-control';
import { StyledField } from '../base-control/styles/base-control-styles';
import { space } from '../ui/utils/space';
import Button from '../button';
import {
	BackdropUI,
	Container as InputControlContainer,
	Input,
} from '../input-control/styles/input-control-styles';
import InputControl from '../input-control';
import CONFIG from '../utils/config-values';

export const NumberControlWrapper = styled( NumberControl )`
	${ InputControlContainer } {
		width: ${ space( 24 ) };
	}
`;

export const SelectControl = styled( InnerSelectControl )`
	margin-left: ${ space( -2 ) };
	width: 5em;
	${ BackdropUI } {
		display: none;
	}
`;

export const RangeControl = styled( InnerRangeControl )`
	flex: 1;

	${ StyledField } {
		margin-bottom: 0;
	}
`;

// All inputs should be the same height so this should be changed at the component level.
// That involves changing heights of multiple input types probably buttons too etc.
// So until that is done we are already using the new height on the color picker so it matches the mockups.
const inputHeightStyle = `
&&& ${ Input } {
	height: 40px;
}`;

// Make the Hue circle picker not go out of the bar
const interactiveHueStyles = `
.react-colorful__interactive {
	width: calc( 100% - ${ space( 2 ) } );
	margin-left: ${ space( 1 ) };
}`;

export const AuxiliaryColorArtefactWrapper = styled.div`
	padding: ${ space( 2 ) } ${ space( 4 ) };
`;

export const ColorfulWrapper = styled.div`
	width: 216px;

	.react-colorful {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 216px;
		height: auto;
	}

	.react-colorful__saturation {
		width: 100%;
		border-radius: 0;
		height: 216px;
		margin-bottom: ${ space( 4 ) };
		border-bottom: none;
	}

	.react-colorful__hue,
	.react-colorful__alpha {
		width: 184px;
		height: 16px;
		border-radius: 16px;
		margin-bottom: ${ space( 2 ) };
	}

	.react-colorful__pointer {
		height: 16px;
		width: 16px;
		border: none;
		box-shadow: 0 0 2px 0 rgba( 0, 0, 0, 0.25 );

		// Shown instead of box-shadow to Windows high contrast mode.
		outline: 2px solid transparent;
	}

	.react-colorful__pointer-fill {
		box-shadow: inset 0 0 0 ${ CONFIG.borderWidthFocus } #fff;
	}

	${ interactiveHueStyles }

	${ StyledField } {
		margin-bottom: 0;
	}

	${ inputHeightStyle }
`;

export const DetailsControlButton = styled( Button )`
	&&&&& {
		min-width: ${ space( 6 ) };
		padding: 0;
	}
`;

export const ColorHexInputControl = styled( InputControl )`
	width: 8em;
`;
