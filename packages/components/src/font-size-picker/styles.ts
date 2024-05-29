/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import { HStack } from '../h-stack';
import { space } from '../utils/space';
import { COLORS } from '../utils';

export const Container = styled.fieldset`
	border: 0;
	margin: 0;
	padding: 0;
`;

export const Header = styled( HStack )`
	height: ${ space( 4 ) };
`;

export const HeaderToggle = styled( Button )`
	margin-top: ${ space( -1 ) };
`;

export const HeaderLabel = styled( BaseControl.VisualLabel )`
	display: flex;
	gap: ${ space( 1 ) };
	justify-content: flex-start;
	margin-bottom: 0;
`;

export const HeaderHint = styled.span`
	color: ${ COLORS.gray[ 700 ] };
`;
