/**
 * External dependencies
 */
import { css } from 'emotion';

/**
 * Internal dependencies
 */
import CONFIG from '../utils/config-values';

export const Divider = css`
	border-color: ${ CONFIG.colorDivider };
	border-width: 0 0 1px 0;
	height: 0;
	margin: 0;
	width: auto;
`;
