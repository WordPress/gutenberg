import type { CSSProperties } from 'react';
import { groups } from '../../prebuilt/js/design-tokens.mjs';
import { TokenText, tokenCardProps } from './token-item';
import { itemStyle, listStyle, previewStyle } from './token-preview-styles';

const cursorTokens = groups.cursor.tokens;

const controlStyle: CSSProperties = {
	cursor: 'var(--wpds-cursor-control)',
	padding:
		'var(--wpds-dimension-padding-sm) var(--wpds-dimension-padding-lg)',
	fontFamily: 'var(--wpds-typography-font-family-body)',
	fontSize: 'var(--wpds-typography-font-size-md)',
	color: 'var(--wpds-color-foreground-interactive-brand-strong)',
	backgroundColor: 'var(--wpds-color-background-interactive-brand-strong)',
	border: 'none',
	borderRadius: 'var(--wpds-border-radius-sm)',
};

/**
 * Lists the cursor tokens with a live example: hover the button to see the
 * cursor that `--wpds-cursor-control` resolves to.
 */
export function CursorTokenPreview() {
	return (
		<div style={ previewStyle }>
			<dl style={ listStyle }>
				{ cursorTokens.map( ( name ) => (
					<div
						key={ name }
						{ ...tokenCardProps( name ) }
						style={ {
							...itemStyle,
							gridTemplateColumns: 'minmax(96px, 160px) 1fr',
						} }
					>
						<dd style={ { margin: 0 } }>
							<button type="button" style={ controlStyle }>
								Hover me
							</button>
						</dd>
						<TokenText name={ name } />
					</div>
				) ) }
			</dl>
		</div>
	);
}
