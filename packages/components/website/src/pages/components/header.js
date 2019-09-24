/**
 * External dependencies
 */
import React from 'react';
import styled from 'styled-components';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function Header( props ) {
	const { slug } = props;
	const githubUrl = `https://github.com/WordPress/gutenberg/tree/master/packages/components/src/${ slug }`;

	return (
		<HeaderUI>
			<Button isDefault isSmall href={ githubUrl } target="_blank">
				View on Github
			</Button>
		</HeaderUI>
	);
}

const HeaderUI = styled.div`
	padding: 15px 0;
	position: absolute;
	right: 0;
	top: 0;
`;
