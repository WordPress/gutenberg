import type { CSSProperties } from 'react';
import { groups } from '../../prebuilt/js/design-tokens.mjs';
import { GroupTitle } from './group-title';
import { TokenText, tokenCardProps } from './token-item';
import { itemStyle, listStyle, previewStyle } from './token-preview-styles';

const widthExampleStyle = ( name: string ): CSSProperties => ( {
	display: 'block',
	width: '100%',
	height: 0,
	borderBlockStart: `var(${ name }) solid ${
		name === '--wpds-border-width-focus'
			? 'var(--wpds-color-stroke-focus)'
			: 'var(--wpds-color-foreground-content-neutral)'
	}`,
} );

const radiusExampleStyle = ( name: string ): CSSProperties => ( {
	display: 'block',
	width: 'var(--wpds-dimension-size-lg)',
	height: 'var(--wpds-dimension-size-lg)',
	backgroundColor: 'var(--wpds-color-background-surface-brand)',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-interactive-brand)',
	borderRadius: `var(${ name })`,
} );

type BorderGroupKey = keyof typeof groups.border.groups;

const borderGroupConfig: Record<
	BorderGroupKey,
	{ example: ( name: string ) => CSSProperties }
> = {
	width: { example: widthExampleStyle },
	radius: { example: radiusExampleStyle },
};

/**
 * Displays the border width tokens as lines and the border radius tokens as
 * the corners of a box.
 */
export function BorderTokenPreview() {
	return (
		<div style={ previewStyle }>
			{ ( Object.keys( groups.border.groups ) as BorderGroupKey[] ).map(
				( kind ) => {
					const group = groups.border.groups[ kind ];
					const { example } = borderGroupConfig[ kind ];
					return (
						<section key={ kind }>
							<GroupTitle
								name={ kind }
								id={ `border-${ kind }` }
							/>
							<p>{ group.$description }</p>
							<dl style={ listStyle }>
								{ group.tokens.map( ( name ) => (
									<div
										key={ name }
										{ ...tokenCardProps( name ) }
										style={ {
											...itemStyle,
											gridTemplateColumns: '80px 1fr',
										} }
									>
										<dd
											style={ { margin: 0 } }
											aria-hidden="true"
										>
											<span style={ example( name ) } />
										</dd>
										<TokenText name={ name } />
									</div>
								) ) }
							</dl>
						</section>
					);
				}
			) }
		</div>
	);
}
