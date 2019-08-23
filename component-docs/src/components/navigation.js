/**
 * External dependencies
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
/**
 * Internal dependencies
 */
import { useScrollIntoView } from '../utils/hooks';
import data from '../data/navigation.json';

function MenuList( props ) {
	const { items } = props;
	useScrollIntoView( '.NavigationMenuList a.active' );

	return (
		<ul className="NavigationMenuList">
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
	const navItems = data.filter( ( item ) => item.url !== '/components/' );

	return (
		<NavigationWrapper>
			<NavigationBody>
				<h2>Components</h2>
				<MenuList items={ navItems } />
			</NavigationBody>
		</NavigationWrapper>
	);
}

const NavigationWrapper = styled.div`
	a {
		color: black;
		display: block;
		text-decoration: none;
	}
`;

const NavigationBody = styled.div`
	padding: 20px;

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
