/**
 * External dependencies
 */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import InputBase from '../input-control/input-base';

type BackCompatMinWidthProps = {
	__nextUnconstrainedWidth: boolean;
};

const backCompatMinWidth = ( props: BackCompatMinWidthProps ) =>
	! props.__nextUnconstrainedWidth
		? css`
				.components-input-control__container {
					min-width: 130px;
				}
		  `
		: '';

export const InputBaseWithBackCompatMinWidth = styled( InputBase )`
	${ backCompatMinWidth }
`;
