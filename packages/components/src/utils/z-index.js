/**
 * External dependencies
 */
import { get } from 'lodash';
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import Z_INDEX from './z-index-values';

export const zIndex = ( key ) =>
	css`
		z-index: ${ get( Z_INDEX, key, 0 ) };
	`;
