/**
 * External dependencies
 */
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import { color } from '../../utils/colors';

export const styleProps = {
	borderColor: color( 'lightGray.500' ),
	borderRadius: '3px',
	backgroundShady: color( 'lightGray.200' ),
};

const { borderColor, borderRadius, backgroundShady } = styleProps;

export const CardUI = styled.div`
	background: ${ color( 'white' ) };
	box-sizing: border-box;
	border-radius: ${ borderRadius };
	border: 1px solid ${ borderColor };

	${ handleBorderless };

	&.is-variant {
		&-raised {
			border: none;
			box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2),
				0px 1px 1px 0px rgba(0, 0, 0, 0.14),
				0px 2px 1px -1px rgba(0, 0, 0, 0.12);
		}
	}
`;

export const HeaderUI = styled.div`
	border-bottom: 1px solid ${ borderColor };
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

	img,
	iframe {
		display: block;
		height: auto;
		max-width: 100%;
		width: 100%;
	}

	&:first-child {
		img,
		iframe {
			border-top-left-radius: ${ borderRadius };
			border-top-right-radius: ${ borderRadius };
		}
	}

	&:last-child {
		img,
		iframe {
			border-bottom-left-radius: ${ borderRadius };
			border-bottom-right-radius: ${ borderRadius };
		}
	}
`;

export const BodyUI = styled.div`
	box-sizing: border-box;

	${ bodySize };
	${ handleShady };
`;

export const FooterUI = styled.div`
	border-top: 1px solid ${ borderColor };
	border-bottom-left-radius: ${ borderRadius };
	border-bottom-right-radius: ${ borderRadius };
	box-sizing: border-box;

	&:first-child {
		border-top: none;
	}

	${ headerFooterSizes };
	${ handleBorderless };
	${ handleShady };
`;

export const DividerUI = styled.div`
	background-color: ${ borderColor };
	box-sizing: border-box;
	height: 1px;
`;

export function bodySize() {
	return `
		&.is-size {
			&-lg {
				padding: 28px;
			}
			&-md {
				padding: 20px;
			}
			&-sm {
				padding: 12px;
			}
			&-xs {
				padding: 8px;
			}
		}
	`;
}

export function headerFooterSizes() {
	return `
		&.is-size {
			&-lg {
				padding: 20px 28px;
			}
			&-md {
				padding: 12px 20px;
			}
			&-sm {
				padding: 8px 12px;
			}
			&-xs {
				padding: 4px 8px;
			}
		}
	`;
}

export function handleBorderless() {
	return `
		&.is-variant {
			&-borderless {
				border: none;
			}
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
