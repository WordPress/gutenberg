/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { Icons } from '@storybook/components';

const StyledIcons = styled( Icons )`
	display: inline-block !important;
	width: 14px;
`;

export const InlineIcon = ( props ) => <StyledIcons aria-hidden { ...props } />;
