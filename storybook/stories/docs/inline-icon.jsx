/**
 * External dependencies
 */
import styled from '@emotion/styled';

const IconWrapper = ( { icon, ...props } ) => {
	const IconComponent = icon;
	return <IconComponent aria-hidden { ...props } />;
};

export const InlineIcon = styled( IconWrapper )`
	display: inline-block !important;
	width: 14px;
`;
