/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import NumberControl from '../../number-control';
import InnerSelectControl from '../../select-control';
import InnerRangeControl from '../../range-control';
import { StyledField } from '../../base-control/styles/base-control-styles';
import { space } from '../utils/space';
import {
	BackdropUI,
	Container as InputControlContainer,
	Input,
} from '../../input-control/styles/input-control-styles';

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
		border: 1.5px solid #ffffff;
		box-shadow: 0px 0px 3px rgba( 0, 0, 0, 0.25 );
	}

	${ StyledField } {
		margin-bottom: 0;
	}

	${ inputHeightStyle }
`;
