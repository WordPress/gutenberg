/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { config } from '../../utils';
import { appearBusy } from './busy-styles';
import { SecondaryAndTertiaryBase } from './base-styles';

export const SecondaryButton = styled( SecondaryAndTertiaryBase )`
	box-shadow: inset 0 0 0 ${ config( 'borderWidth' ) }
		var( --wp-admin-theme-color );
	outline: 1px solid transparent; // Shown in high contrast mode.
	white-space: nowrap;
	color: var( --wp-admin-theme-color );
	background: transparent;

	${ appearBusy }
`;
