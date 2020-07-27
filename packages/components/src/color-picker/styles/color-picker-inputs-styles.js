/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * Internal dependencies
 */
import Text from '../../text';
import { rtl, space } from '../../utils';

export const LabelText = styled( Text )`
	display: block;
	font-size: 10px;
	opacity: 0.5;
	text-align: center;
`;

export const AlphaPercentageLabel = styled( Text )`
	display: block;
	font-size: 10px;
	opacity: 0.5;
	padding: ${ space( 0.5 ) };
	position: absolute;
	text-align: center;
	top: 50%;
	${ rtl( { right: 0 } ) };
	${ rtl(
		{ transform: 'translate(0, -50%)' },
		{ transform: 'translate(-50%, 0)' }
	) };
`;
