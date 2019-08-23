/**
 * External dependencies
 */
import React from 'react';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import Label from './label';

export default function Input( props ) {
	const { label, ...rest } = props;

	const labelMarkup = label ? <Label>{ label }</Label> : null;

	return (
		<>
			{ labelMarkup }
			<InputUI { ...rest } />
		</>
	);
}

const InputUI = styled.input`
	border-radius: 4px;
	border: 1px solid #8d96a0;
	box-shadow: 0 0 0 transparent;
	font-size: 0.8rem;
	padding: 6px 8px;
	width: 100%;
	transition: box-shadow 0.1s linear;

	&:focus {
		border-color: #007cba;
		box-shadow: 0 0 0 1px #007cba;
		color: #191e23;
		outline-offset: -2px;
		outline: 2px solid transparent;
	}
`;
