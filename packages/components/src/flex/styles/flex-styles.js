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

const justifyStyle = ( { justify } ) => {
	const justifies = {
		left: 'flex-start',
		right: 'flex-end',
	};
	const value = justifies[ justify ] || justify;

	return css( {
		justifyContent: value,
	} );
};

const gapStyle = ( { gap } ) => {
	const base = 4;
	const value = typeof gap === 'number' ? base * gap : base;

	return css`
		> * {
			padding-right: ${value}px;

			&:last-child {
				padding-right: 0;
			}
		}
	`;
};

export const Flex = styled.div`
	box-sizing: border-box;
	display: flex;

	${alignStyle};
	${justifyStyle};
	${gapStyle};
`;

export const Item = styled.div`
	box-sizing: border-box;
	min-width: 0;
	max-width: 100%;
`;

export const Block = styled( Item )`
	flex: 1;
`;
