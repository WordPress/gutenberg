/**
 * External dependencies
 */
import styled from '@emotion/styled';
import {
	color,
	space,
	layout,
	flexbox,
	background,
	border,
	position,
	shadow,
} from 'styled-system';
/**
 * Internal dependencies
 */

import { additionalStylesHelper } from '../additional-styles-helper';

const Button = styled.button`
${ color }
${ space }
${ layout }
${ flexbox }
${ background }
${ border }
${ position }
${ shadow }
`;

export const PrimitiveButton = ( {
	additionalStyles = [],
	children,
	...props
} ) => (
	<Button { ...props } css={ additionalStylesHelper( additionalStyles ) }>
		{ children }
	</Button>
);
