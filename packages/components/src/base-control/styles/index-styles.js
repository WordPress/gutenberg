/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { marginTop, marginBottom } from '../../utils/style-mixins';
import { text } from '../../text/mixins';

export const Control = styled.div`
	& + & {
		${marginBottom( 2 )}
	}
`;

export const Field = styled.div`
	${marginBottom( 2 )}
`;

export const Label = styled.label`
	display: inline-block;
	${text( { variant: 'body.small' } )}
	${marginBottom( 1 )}
`;

export const Help = styled.p`
	font-style: italic;
	${text( { variant: 'caption' } )}
	${marginTop( -2 )}
`;
