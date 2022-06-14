/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import { space } from '../ui/utils/space';

const focused = css`
	outline: 2px solid hsl( 204, 100%, 40% );
`;

//  TODO: convert to Flex or HStack
export const wrapper = css`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

// TODO: use base control label? Text? Heading?
export const label = css``;

// TODO: convert to Flex?
export const select = css`
	/* Should be set by parent */
	width: 200px;
	display: flex;
	height: 2.5rem;
	cursor: default;
	align-items: center;
	justify-content: space-between;
	gap: 0.25rem;
	white-space: nowrap;
	border-radius: 0.5rem;
	background-color: hsl( 204, 20%, 94% );
	padding-left: 1rem;
	padding-right: 1rem;
	font-size: 1rem;
	line-height: 1.5rem;

	&:hover {
		background-color: hsl( 204, 20%, 91% );
	}

	&[aria-disabled='true'] {
		opacity: 0.5;
	}

	&:focus-visible,
	&[data-focus-visible] {
		${ focused };
	}
`;

// TODO: convert to Flex?
export const popover = css`
	z-index: 50;
	display: flex;
	max-height: 20rem;
	flex-direction: column;
	border-radius: 0.5rem;
	border-width: 1px;
	border-style: solid;
	border-color: hsl( 204, 20%, 88% );
	background-color: hsl( 204, 20%, 100% );
	padding: 0.5rem;
	color: hsl( 204, 10%, 10% );
	filter: drop-shadow( 0 4px 6px rgba( 0, 0, 0, 15% ) );

	&:focus-visible,
	&[data-focus-visible] {
		${ focused };
	}
`;

export const item = css`
	outline: none;
	display: flex;
	cursor: default;
	scroll-margin: 0.5rem;
	align-items: center;
	gap: 0.5rem;
	border-radius: 0.25rem;
	padding: 0.5rem;

	&[data-active-item] {
		background-color: hsl( 204, 100%, 40% );
		color: hsl( 0, 0%, 100% );
	}

	&[aria-disabled='true'] {
		opacity: 0.5;
	}
`;
