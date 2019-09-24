/**
 * External dependencies
 */
import React from 'react';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import pkg from '../../data/pkg.json';
import { getColor } from '../../utils/color';

export default function Version() {
	const { version } = pkg;
	return <BadgeUI>v{ version }</BadgeUI>;
}

const BadgeUI = styled.div`
	border-radius: 4px;
	background: ${ getColor( 'Gray 5' ) };
	color: ${ getColor( 'Gray 80' ) };
	font-size: 0.8rem;
	padding: 2px 8px;
`;
