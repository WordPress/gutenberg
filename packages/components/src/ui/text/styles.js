/**
 * External dependencies
 */
import { css, ui } from '@wp-g2/styles';

export const Text = css`
	color: ${ ui.color.text };
	line-height: ${ ui.get( 'fontLineHeightBase' ) };
`;

export const block = css`
	display: block;
`;

export const positive = css`
	color: ${ ui.color.positive };
`;

export const destructive = css`
	color: ${ ui.color.destructive };
`;

export const muted = css`
	color: ${ ui.get( 'colorTextMuted' ) };
`;

export const highlighterText = css`
	mark {
		background: ${ ui.get( 'yellowRgba70' ) };
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgba( 0, 0, 0, 0.05 ) inset,
			0 -1px 0 rgba( 0, 0, 0, 0.1 ) inset;
	}
`;

export const upperCase = css`
	text-transform: uppercase;
`;
