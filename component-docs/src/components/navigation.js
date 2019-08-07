/**
 * External dependencies
 */
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import data from '../data/navigation.json';

function MenuList( props ) {
	const { items } = props;

	return (
		<ul>
			{ items.map( ( item ) => {
				return (
					<li key={ item.id }>
						<NavLink to={ item.url }>{ item.title }</NavLink>
					</li>
				);
			} ) }
		</ul>
	);
}

function Navigation() {
	const items = data.filter( ( item ) => item.url !== '/' );
	return (
		<NavigationWrapper>
			<NavigationHeader>
				<Link to="/">
					<h1>WordPress Components</h1>
				</Link>
			</NavigationHeader>
			<NavigationBody>
				<MenuList items={ items } />
			</NavigationBody>
		</NavigationWrapper>
	);
}

const NavigationWrapper = styled( 'div' )`
	position: relative;
	display: flex;
	flex-flow: column;
	height: 100%;

	a {
		color: black;
		display: block;
		text-decoration: none;
	}
`;

const NavigationHeader = styled( 'div' )`
	padding: 0;
	border-bottom: 1px solid #eee;
	text-align: center;

	a {
		padding: 30px 20px;
		display: block;
	}

	h1 {
		margin: 0;
	}
`;

const NavigationBody = styled( 'div' )`
	padding: 20px 20px 10vh;
	flex: 1;
	height: 100%;
	min-height: 0;
	overflow-y: auto;

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	a {
		padding: 5px 0;
		opacity: 0.6;

		&:hover {
			opacity: 1;
		}

		&.active {
			font-weight: bold;
			opacity: 1;
		}
	}
`;

export default Navigation;
