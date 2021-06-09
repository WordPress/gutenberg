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
	borderRadiusInternal: '3px',
	backgroundShady: COLORS.lightGray[ 200 ],
};

const { borderColorInternal, borderRadiusInternal, backgroundShady } = styleProps;

export const CardUI = styled.div`
	background: ${ COLORS.white };
	box-sizing: border-box;
	border-radius: ${ borderRadiusInternal };
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
	border-top-left-radius: ${ borderRadiusInternal };
	border-top-right-radius: ${ borderRadiusInternal };
	box-sizing: border-box;

	&:last-child {
		border-bottom: none;
	}

	${ headerFooterSizes };
	${ handleBorderless };
	${ handleShady };
`;

export const BodyUI = styled.div`
	box-sizing: border-box;

	${ bodySize };
	${ handleShady };
`;

export const FooterUI = styled( Flex )`
	border-top: 1px solid ${ borderColorInternal };
	border-bottom-left-radius: ${ borderRadiusInternal };
	border-bottom-right-radius: ${ borderRadiusInternal };
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

export const Media = css`
	box-sizing: border-box;
	overflow: hidden;

	& > img,
	& > iframe {
		display: block;
		height: auto;
		max-width: 100%;
		width: 100%;
	}
`;

export const Divider = css`
	box-sizing: border-box;
	display: block;
	width: 100%;
`;

export const borderRadius = css`
	&:first-of-type {
		border-top-left-radius: ${ CONFIG.cardBorderRadius };
		border-top-right-radius: ${ CONFIG.cardBorderRadius };
	}

	&:last-of-type {
		border-bottom-left-radius: ${ CONFIG.cardBorderRadius };
		border-bottom-right-radius: ${ CONFIG.cardBorderRadius };
	}
`;

export const borderColor = css`
	border-color: ${ CONFIG.colorDivider };
`;
