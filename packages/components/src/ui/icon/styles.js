/**
 * External dependencies
 */
import { css, ui } from '@wp-g2/styles';

export const Wrapper = css`
	display: block;
	user-select: none;

	svg {
		display: block;
	}
`;

export const inline = css`
	display: inline-block;
	vertical-align: middle;
`;

export const muted = css`
	color: ${ ui.get( 'colorTextMuted' ) };
`;
