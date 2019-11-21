/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import {
	inputPlaceholder,
	inputOutline,
	focusedInputOutline,
	paddingX,
	paddingY,
} from '../../utils/style-mixins';
import { text } from '../../text/mixins';

export const Input = styled.input`
	box-sizing: border-box;
	width: 100%;
	${ paddingX( 2 ) }
	${ paddingY( 1 ) }
	${ text( { variant: 'body' } ) }
	${ inputPlaceholder() }
	${ inputOutline() }
	&:focus {
		${ focusedInputOutline() }
	}
`;
