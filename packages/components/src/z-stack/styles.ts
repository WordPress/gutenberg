/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
import { css } from '@emotion/css';
import styled from '@emotion/styled';

export const ZStackView = styled.div`
	display: flex;
	position: relative;
`;

export const positionAbsolute = css`
	position: absolute;
`;

export const positionRelative = css`
	position: relative;
`;
