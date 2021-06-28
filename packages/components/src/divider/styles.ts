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

type Props = {
	margin?: number;
	marginTop?: number;
	marginBottom?: number;
};

const renderMargin = ( { margin, marginTop, marginBottom }: Props ) => {
	if ( typeof margin !== 'undefined' ) {
		return css( {
			marginBottom: space( margin ),
			marginTop: space( margin ),
		} );
	}

	return css( {
		marginTop,
		marginBottom,
	} );
};

export const StyledHorizontalRule = styled.hr< Props >`
	border-color: ${ CONFIG.colorDivider };
	border-width: 0 0 1px 0;
	height: 0;
	margin: 0;
	width: auto;

	${ renderMargin }
`;
