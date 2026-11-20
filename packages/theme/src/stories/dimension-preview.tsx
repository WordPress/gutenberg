import type { CSSProperties, ReactNode } from 'react';
import { groups, tokens } from '../../prebuilt/js/design-tokens.mjs';
import { GroupTitle } from './group-title';
import { TokenTable } from './token-table';
import { previewStyle } from './token-preview-styles';

const surfaceWidth = ( name: string ) =>
	parseFloat(
		( tokens as Record< string, { modes: { default: { css: string } } } > )[
			name
		].modes.default.css
	);

const widestSurfaceWidth = Math.max(
	...groups.dimension.groups[ 'surface-width' ].tokens.map( surfaceWidth )
);

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
		// A table cell cannot show the widest surface at its true size, so each
		// bar is drawn in proportion to it.
		example: ( name ) => (
			<span
				style={ {
					...boxStyle,
					display: 'block',
					width: `${
						( surfaceWidth( name ) / widestSurfaceWidth ) * 100
					}%`,
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
						<GroupTitle name={ key } id={ `dimension-${ key }` } />
						<p>{ group.$description }</p>
						<TokenTable
							names={ group.tokens }
							renderSample={ example }
							{ ...( key === 'surface-width' && {
								sampleWidth: '45%',
								tokenWidth: '35%',
							} ) }
						/>
					</section>
				);
			} ) }
		</div>
	);
}
