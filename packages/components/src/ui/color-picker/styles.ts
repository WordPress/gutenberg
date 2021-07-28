/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InnerSelectControl from '../../select-control';
import { StyledField } from '../../base-control/styles/base-control-styles';
import { space } from '../utils/space';

export const SelectControl = styled( InnerSelectControl )`
	width: 5em;
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
	}

	.react-colorful__hue,
	.react-colorful__alpha {
		width: 184px;
		border-radius: 16px;
		margin-bottom: ${ space( 2 ) };
	}

	${ StyledField } {
		margin-bottom: 0;
	}
`;
