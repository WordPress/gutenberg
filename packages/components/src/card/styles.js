/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css } from 'emotion';

/**
 * Internal dependencies
 */
import { Flex } from '../flex';
import { COLORS, CONFIG, space } from '../utils';

export const styleProps = {
	borderColorInternal: COLORS.lightGray[ 500 ],
	borderRadius: '3px',
	backgroundShady: COLORS.lightGray[ 200 ],
};

const { borderColorInternal, borderRadius, backgroundShady } = styleProps;

export const CardUI = styled.div`
	background: ${ COLORS.white };
	box-sizing: border-box;
	border-radius: ${ borderRadius };
	border: 1px solid ${ borderColorInternal };

	${ handleBorderless };

	&.is-elevated {
		box-shadow: 0px 1px 3px 0px rgba( 0, 0, 0, 0.2 ),
			0px 1px 1px 0px rgba( 0, 0, 0, 0.14 ),
			0px 2px 1px -1px rgba( 0, 0, 0, 0.12 );
	}
`;

export const HeaderUI = styled( Flex )`
	border-bottom: 1px solid ${ borderColorInternal };
	border-top-left-radius: ${ borderRadius };
	border-top-right-radius: ${ borderRadius };
	box-sizing: border-box;

	&:last-child {
		border-bottom: none;
	}

	${ headerFooterSizes };
	${ handleBorderless };
	${ handleShady };
`;

export const MediaUI = styled.div`
	box-sizing: border-box;
	overflow: hidden;

	& > img,
	& > iframe {
		display: block;
		height: auto;
		max-width: 100%;
		width: 100%;
	}

	&:first-of-type {
		border-top-left-radius: ${ borderRadius };
		border-top-right-radius: ${ borderRadius };
	}

	&:last-of-type {
		border-bottom-left-radius: ${ borderRadius };
		border-bottom-right-radius: ${ borderRadius };
	}
`;

export const BodyUI = styled.div`
	box-sizing: border-box;

	${ bodySize };
	${ handleShady };
`;

export const FooterUI = styled( Flex )`
	border-top: 1px solid ${ borderColorInternal };
	border-bottom-left-radius: ${ borderRadius };
	border-bottom-right-radius: ${ borderRadius };
	box-sizing: border-box;

	&:first-of-type {
		border-top: none;
	}

	${ headerFooterSizes };
	${ handleBorderless };
	${ handleShady };
`;

export function bodySize() {
	return `
		&.is-size {
			&-large {
				padding: ${ space( 3 ) } ${ space( 4 ) };
			}
			&-medium {
				padding: ${ space( 2 ) } ${ space( 3 ) };
			}
			&-small {
				padding: ${ space( 2 ) };
			}
			&-extraSmall {
				padding: ${ space( 1 ) };
			}
		}
	`;
}

export function headerFooterSizes() {
	return `
		&.is-size {
			&-large {
				padding: ${ space( 3 ) } ${ space( 4 ) };
			}
			&-medium {
				padding: ${ space( 2 ) } ${ space( 3 ) };
			}
			&-small {
				padding: ${ space( 2 ) };
			}
			&-extraSmall {
				padding: ${ space( 1 ) };
			}
		}
	`;
}

export function handleBorderless() {
	return `
		&.is-borderless {
			border: none;
		}
	`;
}

export function handleShady() {
	return `
		&.is-shady {
			background: ${ backgroundShady };
		}
	`;
}

export const Divider = css`
	box-sizing: border-box;
	display: block;
	width: 100%;
`;

export const borderColor = css`
	border-color: ${ CONFIG.colorDivider };
`;
