/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { color, space, rtl } from '../../utils';

export const StyledTip = styled.div`
	display: flex;
	color: ${ color( 'mediumGray.text' ) };

	svg {
		align-self: center;
		fill: ${ color( 'alert.yellow' ) };
		flex-shrink: 0;
		${ rtl( { marginRight: space( 2 ) } ) }
	}

	p {
		margin: 0;
	}
`;
