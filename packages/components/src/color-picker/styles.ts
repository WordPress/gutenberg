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
import { space } from '../ui/utils/space';
import { boxSizingReset } from '../utils';
import Button from '../button';
import { Flex } from '../flex';
import { HStack } from '../h-stack';
import {
	BackdropUI,
	Container as InputControlContainer,
} from '../input-control/styles/input-control-styles';
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
	margin-right: ${ space( 2 ) };
`;

// Make the Hue circle picker not go out of the bar.
const interactiveHueStyles = `
.react-colorful__interactive {
	width: calc( 100% - ${ space( 2 ) } );
	margin-left: ${ space( 1 ) };
}`;

export const AuxiliaryColorArtefactWrapper = styled.div`
	padding-top: ${ space( 2 ) };
	padding-right: 0;
	padding-left: 0;
	padding-bottom: 0;
`;

export const AuxiliaryColorArtefactHStackHeader = styled( HStack )`
	padding-left: ${ space( 4 ) };
	padding-right: ${ space( 4 ) };
`;

export const ColorInputWrapper = styled( Flex )`
	padding-top: ${ space( 4 ) };
	padding-left: ${ space( 4 ) };
	padding-right: ${ space( 3 ) };
	padding-bottom: ${ space( 5 ) };
`;

export const ColorfulWrapper = styled.div`
	${ boxSizingReset };

	width: 216px;

	.react-colorful {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 216px;
		height: auto;
		overflow: hidden;
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
`;

export const CopyButton = styled( Button )`
	&&&&& {
		min-width: ${ space( 6 ) };
		padding: 0;

		> svg {
			margin-right: 0;
		}
	}
`;
