import type { CSSProperties, ReactNode } from 'react';
import { groups, tokens } from '../../prebuilt/js/design-tokens.mjs';
import { GroupTitle } from './group-title';
import {
	descriptionStyle,
	itemStyle,
	listStyle,
	previewStyle,
	textStyle,
	tokenNameStyle,
} from './token-preview-styles';

const boxStyle: CSSProperties = {
	backgroundColor: 'var(--wpds-color-background-surface-brand)',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-interactive-brand)',
	borderRadius: 'var(--wpds-border-radius-xs)',
};

const contentStyle: CSSProperties = {
	backgroundColor: 'var(--wpds-color-background-interactive-brand-strong)',
};

type DimensionKind = {
	example: ( name: string ) => ReactNode;
};

type DimensionGroupKey = keyof typeof groups.dimension.groups;

const dimensionConfig: Record< DimensionGroupKey, DimensionKind > = {
	padding: {
		example: ( name ) => (
			<span
				style={ {
					...boxStyle,
					display: 'inline-block',
					padding: `var(${ name })`,
				} }
			>
				<span
					style={ {
						...contentStyle,
						display: 'block',
						width: 'var(--wpds-dimension-size-sm)',
						height: 'var(--wpds-dimension-size-xs)',
					} }
				/>
			</span>
		),
	},
	gap: {
		example: ( name ) => (
			<span
				style={ {
					display: 'flex',
					gap: `var(${ name })`,
				} }
			>
				{ [ 0, 1, 2 ].map( ( i ) => (
					<span
						key={ i }
						style={ {
							...contentStyle,
							display: 'block',
							width: 'var(--wpds-dimension-size-sm)',
							height: 'var(--wpds-dimension-size-sm)',
							borderRadius: 'var(--wpds-border-radius-xs)',
						} }
					/>
				) ) }
			</span>
		),
	},
	size: {
		example: ( name ) => (
			<span
				style={ {
					...contentStyle,
					display: 'block',
					width: `var(${ name })`,
					height: `var(${ name })`,
					borderRadius: 'var(--wpds-border-radius-xs)',
				} }
			/>
		),
	},
	'surface-width': {
		example: ( name ) => (
			<span
				style={ {
					...boxStyle,
					display: 'block',
					width: `var(${ name })`,
					height: 'var(--wpds-dimension-size-md)',
				} }
			/>
		),
	},
};

/**
 * Displays the dimension tokens grouped by purpose, each with an example of
 * how the value applies.
 */
export function DimensionTokenPreview() {
	return (
		<div style={ previewStyle }>
			{ (
				Object.keys( groups.dimension.groups ) as DimensionGroupKey[]
			 ).map( ( key ) => {
				const group = groups.dimension.groups[ key ];
				const { example } = dimensionConfig[ key ];
				return (
					<section key={ key }>
						<GroupTitle name={ key } />
						<p>{ group.$description }</p>
						<dl style={ { ...listStyle, marginBlockStart: 8 } }>
							{ group.tokens.map( ( name ) => (
								<div
									key={ name }
									style={ {
										...itemStyle,
										gridTemplateColumns:
											key === 'surface-width'
												? '1fr'
												: 'minmax(96px, 1fr) 2fr',
									} }
								>
									<dt style={ textStyle }>
										<code style={ tokenNameStyle }>
											{ name }
										</code>
										<span style={ descriptionStyle }>
											{ tokens[ name ].$description }
										</span>
									</dt>
									<dd
										style={ {
											margin: 0,
											// Let wide examples (surface widths) scroll instead of
											// shrinking, so their widths stay comparable.
											minWidth: 0,
											overflowX: 'auto',
										} }
										aria-hidden="true"
									>
										{ example( name ) }
									</dd>
								</div>
							) ) }
						</dl>
					</section>
				);
			} ) }
		</div>
	);
}
