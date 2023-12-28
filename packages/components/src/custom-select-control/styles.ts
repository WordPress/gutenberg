/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InputBase from '../input-control/input-base';
import { Container as InputControlContainer } from '../input-control/styles/input-control-styles';

type BackCompatMinWidthProps = {
	__nextUnconstrainedWidth: boolean;
};

const backCompatMinWidth = ( props: BackCompatMinWidthProps ) =>
	! props.__nextUnconstrainedWidth
		? css`
				${ InputControlContainer } {
					min-width: 130px;
				}
		  `
		: '';

export const InputBaseWithBackCompatMinWidth = styled( InputBase )`
	${ backCompatMinWidth }
`;
