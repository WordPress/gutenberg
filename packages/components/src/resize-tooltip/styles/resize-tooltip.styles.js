/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Text from '../../text';
import { color } from '../../utils/style-mixins';

export const Root = styled.div`
	bottom: 0;
	box-sizing: border-box;
	left: 0;
	pointer-events: none;
	position: absolute;
	right: 0;
	top: 0;
`;

export const TooltipWrapper = styled.div`
	align-items: center;
	box-sizing: border-box;
	display: inline-flex;
	justify-content: center;
	opacity: 0;
	pointer-events: none;
	transition: opacity 120ms linear;

	${ ( { isActive } ) =>
		isActive &&
		`
	opacity: 1;
` }
`;

export const Tooltip = styled.div`
	background: ${ color( 'ui.border' ) };
	border-radius: 2px;
	box-shadow: 0 0 0 1px rgba( 255, 255, 255, 0.2 );
	box-sizing: border-box;
	color: ${ color( 'ui.textDark' ) };
	padding: 2px 4px;
`;

export const LabelText = styled( Text )`
	font-size: 13px;
`;
