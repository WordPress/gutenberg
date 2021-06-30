/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { space } from '../ui/utils/space';
import CONFIG from '../utils/config-values';
import type { OwnProps } from './types';

const renderMargin = ( { margin, marginTop, marginBottom }: OwnProps ) => {
	if ( typeof margin !== 'undefined' ) {
		return css( {
			marginBottom: space( margin ),
			marginTop: space( margin ),
		} );
	}

	return css( {
		marginTop: space( marginTop ),
		marginBottom: space( marginBottom ),
	} );
};

export const DividerView = styled.hr< OwnProps >`
	border-color: ${ CONFIG.colorDivider };
	border-width: 0 0 1px 0;
	height: 0;
	margin: 0;
	width: auto;

	${ renderMargin }
`;
