/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Button from '../button';
import CustomSelectControl from '../custom-select-control';
import { HStack } from '../h-stack';
import { space } from '../utils/space';

export const Container = styled.fieldset`
	border: 0;
	margin: 0;
	padding: 0;
	display: contents;
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

// Custom styled component to force line break between name and hint while keeping checkmark on the right
export const StyledCustomSelectControl = styled( CustomSelectControl )`
	.components-custom-select-control__item
		.components-custom-select-control__item-hint {
		width: 100%;
	}
`;
