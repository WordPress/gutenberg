/**
 * External dependencies
 */
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import { getColor } from '../../utils/color';

export default function Logo() {
	return (
		<LogoUI>
			<Link to="/">
				<h1>Wordpress Components</h1>
			</Link>
		</LogoUI>
	);
}

export const LogoUI = styled.div`
	margin-right: 40px;

	a {
		display: block;
		padding: 10px 15px;
	}

	h1 {
		color: ${ getColor( 'Black' ) };
		font-size: 18px;
		font-weight: bold;
		margin: 0;
	}
`;
