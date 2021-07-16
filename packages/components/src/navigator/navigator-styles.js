/**
 * External dependencies
 */
import styled from '@emotion/styled';
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { css } from '@emotion/css';

export const NavigatorView = styled.div`
	height: 100%;
	overflow: hidden;
	position: relative;
`;

export const menuItemLink = css`
	display: flex;
	outline: none;
`;
