/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InnerSelectControl from '../../select-control';
import InnerRangeControl from '../../range-control';
import { StyledField } from '../../base-control/styles/base-control-styles';
import { space } from '../utils/space';

export const SelectControl = styled( InnerSelectControl )`
	width: 5em;
`;

export const RangeControl = styled( InnerRangeControl )`
	flex: 1;

	${ StyledField } {
		margin-bottom: 0;
	}
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
	}

	${ StyledField } {
		margin-bottom: 0;
	}
`;
