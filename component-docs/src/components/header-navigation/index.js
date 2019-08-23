/**
 * External dependencies
 */
import React from 'react';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import Flexy from '../flexy';
import Menu from './menu';
import Logo from './logo';
import { getColor } from '../../utils/color';

export default function HeaderNavigation() {
	return (
		<HeaderUI>
			<Flexy>
				<Flexy.Item>
					<Logo />
				</Flexy.Item>
				<Flexy.Block>
					<Menu />
				</Flexy.Block>
			</Flexy>
		</HeaderUI>
	);
}

export const HeaderUI = styled.div`
	align-items: center;
	background: ${ getColor( 'White' ) };
	border-bottom: 1px solid ${ getColor( 'Gray 5' ) };
	box-shadow: 0px 4px 10px rgba( 0, 0, 0, 0.05 );
	display: flex;
	height: var( --navHeight );
	left: 0;
	padding: 5px 10px;
	position: fixed;
	top: 0;
	width: 100%;
	z-index: 100;

	a {
		text-decoration: none;
	}
`;
