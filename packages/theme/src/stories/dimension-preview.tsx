import type { CSSProperties, ReactNode } from 'react';
import { groups, tokens } from '../../prebuilt/js/design-tokens.mjs';
import {
	descriptionStyle,
	headingStyle,
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
	key: keyof typeof groups.dimension.groups;
	title: string;
	intro: string;
	example: ( name: string ) => ReactNode;
};

const kinds: DimensionKind[] = [
	{
		key: 'padding',
		title: 'Padding',
		intro: 'Space between the edge of a container and its content. The shaded area is the padding.',
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
	{
		key: 'gap',
		title: 'Gap',
		intro: 'Space between sibling elements in a flex or grid layout.',
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
	{
		key: 'size',
		title: 'Size',
		intro: 'Width and height of controls, icons, and markers.',
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
	{
		key: 'surface-width',
		title: 'Surface width',
		intro: 'Widths for surfaces such as popovers, dialogs, and panels.',
		example: ( name ) => (
			<span
				style={ {
					...boxStyle,
					display: 'block',
					width: `var(${ name })`,
					maxWidth: '100%',
					height: 'var(--wpds-dimension-size-md)',
				} }
			/>
		),
	},
];

/**
 * Displays the dimension tokens grouped by purpose, each with an example of
 * how the value applies.
 */
export function DimensionTokenPreview() {
	return (
		<div style={ previewStyle }>
			{ kinds.map( ( { key, title, intro, example } ) => {
				const group = groups.dimension.groups[ key ];
				return (
					<section key={ key }>
						<h2 style={ headingStyle }>{ title }</h2>
						<p>{ intro }</p>
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
											overflow: 'hidden',
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
