/**
 * External dependencies
 */
import { css } from '@emotion/core';

/**
 * Internal dependencies
 */
import { config } from '../../utils';
import { secondaryAndTertiaryBase } from './base-styles';

export const styles = css`
    ${ secondaryAndTertiaryBase }

    box-shadow: inset 0 0 0 ${ config(
		'borderWidth'
	) } var(--wp-admin-theme-color);
    outline: 1px solid transparent; // Shown in high contrast mode.
    white-space: nowrap;
    color: var(--wp-admin-theme-color);
    background: transparent;
`;
