/**
 * External dependencies
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import GithubLink from './github-link';
import Version from './version';
import { getColor } from '../../utils/color';

export default function Menu() {
	return (
		<NavUI>
			<NavListUI>
				<li>
					<NavLink to="/components/">Documentation</NavLink>
				</li>
			</NavListUI>
			<NavListUI>
				<li>
					<Version />
				</li>
				<li>
					<GithubLink />
				</li>
			</NavListUI>
		</NavUI>
	);
}

const NavUI = styled.nav`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;

	a {
		color: ${ getColor( 'Gray 30' ) };
		display: block;
		padding: 15px 15px;

		&:hover,
		&.active {
			color: ${ getColor( 'Black' ) };
		}

		&.active {
			font-weight: bold;
		}
	}
`;

const NavListUI = styled.ul`
	align-items: center;
	display: flex;
	list-style: none;
	padding: 0;
	margin: 0;
`;
