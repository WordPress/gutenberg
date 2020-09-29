/**
 * External dependencies
 */
import { css } from '@emotion/core';
import styled from '@emotion/styled';

const alignStyle = ( { align } ) => {
	const aligns = {
		top: 'flex-start',
		bottom: 'flex-end',
	};
	const value = aligns[ align ] || align;

	return css( {
		alignItems: value,
	} );
};

const justifyStyle = ( { justify, isReversed } ) => {
	const justifies = {
		left: 'flex-start',
		right: 'flex-end',
	};
	let value = justifies[ justify ] || justify;

	if ( isReversed && justifies[ justify ] ) {
		value = justify === 'left' ? justifies.right : justifies.left;
	}

	return css( {
		justifyContent: value,
	} );
};

const gapStyle = ( { gap, isReversed } ) => {
	const base = 4;
	const value = typeof gap === 'number' ? base * gap : base;
	const dir = isReversed ? 'left' : 'right';
	const margin = `margin-${ dir }`;

	return css`
		> * {
			${ margin }: ${ value }px;

			&:last-child {
				${ margin }: 0;
			}
		}
	`;
};

const reversedStyles = ( { isReversed } ) => {
	if ( ! isReversed ) return '';

	return css`
		flex-direction: row-reverse;
	`;
};

export const Flex = styled.div`
	box-sizing: border-box;
	display: flex;
	width: 100%;

	${ alignStyle }
	${ justifyStyle }
	${ gapStyle }
	${ reversedStyles }
`;

export const Item = styled.div`
	box-sizing: border-box;
	min-width: 0;
	max-width: 100%;
`;

export const Block = styled( Item )`
	flex: 1;
`;
