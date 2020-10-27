/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { inputControl } from '../../utils/input';

export const StyledInput = styled.input`
	&,
	&[type='text'],
	&[type='tel'],
	&[type='time'],
	&[type='url'],
	&[type='week'],
	&[type='password'],
	&[type='color'],
	&[type='date'],
	&[type='datetime'],
	&[type='datetime-local'],
	&[type='email'],
	&[type='month'],
	&[type='number'] {
		width: 100%;
		${ inputControl }
	}
`;
