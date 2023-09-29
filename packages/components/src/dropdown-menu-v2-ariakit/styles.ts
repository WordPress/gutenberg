/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

export const toggleButton = css`
	display: flex;
	height: 2.5rem;
	touch-action: none;
	user-select: none;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
	white-space: nowrap;
	border-radius: 0.5rem;
	border-style: none;
	background-color: hsl( 204 20% 100% );
	padding-left: 1rem;
	padding-right: 1rem;
	font-size: 1rem;
	line-height: 1.5rem;
	color: hsl( 204 10% 10% );
	text-decoration-line: none;
	outline-width: 2px;
	outline-offset: 2px;
	outline-color: hsl( 204 100% 40% );
	box-shadow:
		inset 0 0 0 1px rgba( 0, 0, 0, 0.1 ),
		inset 0 -1px 0 rgba( 0, 0, 0, 0.1 ),
		0 1px 1px rgba( 0, 0, 0, 0.1 );
	font-weight: 500;

	&:hover {
		background-color: hsl( 204 20% 96% );
	}

	&[aria-disabled='true'] {
		opacity: 0.5;
	}

	&[aria-expanded='true'] {
		background-color: hsl( 204 20% 96% );
	}

	&[data-focus-visible] {
		outline-style: solid;
	}

	&:active,
	&[data-active] {
		transform: scale( 0.98 );
	}

	&:active[aria-expanded='true'],
	&[data-active][aria-expanded='true'] {
		transform: scale( 1 );
	}

	@media ( min-width: 640px ) {
		gap: 0.5rem;
	}
`;

// :is(.dark .button) {
//   background-color: hsl(204 20% 100% / 0.05);
//   color: hsl(204 20% 100%);
//   box-shadow:
//     inset 0 0 0 1px rgba(255, 255, 255, 0.1),
//     inset 0 -1px 0 1px rgba(0, 0, 0, 0.2),
//     inset 0 1px 0 rgba(255, 255, 255, 0.05);
// }

// :is(.dark .button:hover) {
//   background-color: hsl(204 20% 100% / 0.1);
// }

// :is(.dark .button)[aria-expanded="true"] {
//   background-color: hsl(204 20% 100% / 0.1);
// }

export const StyledAriakitMenu = styled( Ariakit.Menu )`
	position: relative;
	z-index: 50;
	display: flex;
	max-height: var( --popover-available-height );
	min-width: 180px;
	flex-direction: column;
	overscroll-behavior: contain;
	border-radius: 0.5rem;
	border-width: 1px;
	border-style: solid;
	border-color: hsl( 204 20% 88% );
	background-color: hsl( 204 20% 100% );
	padding: 0.5rem;
	color: hsl( 204 10% 10% );
	box-shadow:
		0 10px 15px -3px rgb( 0 0 0 / 0.1 ),
		0 4px 6px -4px rgb( 0 0 0 / 0.1 );
	outline: none !important;
	overflow: visible;
`;

// :is(.dark .menu) {
//   border-color: hsl(204 3% 26%);
//   background-color: hsl(204 3% 18%);
//   color: hsl(204 20% 100%);
//   box-shadow:
//     0 10px 15px -3px rgb(0 0 0 / 0.25),
//     0 4px 6px -4px rgb(0 0 0 / 0.1);
// }

export const StyledAriakitMenuItem = styled( Ariakit.MenuItem )`
	display: flex;
	cursor: default;
	scroll-margin: 0.5rem;
	align-items: center;
	gap: 0.5rem;
	border-radius: 0.25rem;
	padding: 0.5rem;
	outline: none !important;

	&[aria-disabled='true'] {
		opacity: 0.25;
	}

	&[data-active-item] {
		background-color: hsl( 204 100% 40% );
		color: hsl( 204 20% 100% );
	}

	&:active,
	&[data-active] {
		background-color: hsl( 204 100% 32% );
	}

	${ StyledAriakitMenu }:not(:focus) &:not(:focus)[aria-expanded="true"] {
		background-color: hsl( 204 10% 10% / 0.1 );
		color: currentColor;
	}
`;

// :is(.dark .menu:not(:focus) .menu-item:not(:focus)[aria-expanded="true"]) {
//   background-color: hsl(204 20% 100% / 0.1);
// }

export const StyledMenuButtonLabel = styled.span`
	flex: 1 1 0%;
`;
