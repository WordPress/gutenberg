import type { CSSProperties } from 'react';
import { GroupTitle } from './group-title';
import type { tokens } from '../../prebuilt/js/design-tokens.mjs';
import { groups } from '../../prebuilt/js/design-tokens.mjs';
import { TokenTable } from './token-table';
import { previewStyle } from './token-preview-styles';

const swatchStyle: CSSProperties = {
	display: 'block',
	width: 'var(--wpds-dimension-size-md)',
	height: 'var(--wpds-dimension-size-md)',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral)',
	borderRadius: 'var(--wpds-border-radius-sm)',
};

const sectionStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-3xl)',
};

function ColorTokenList( {
	names,
}: {
	names: readonly ( keyof typeof tokens )[];
} ) {
	return (
		<TokenTable
			names={ names }
			sampleWidth="80px"
			tokenWidth="50%"
			renderSample={ ( name ) => (
				<span
					style={ {
						...swatchStyle,
						backgroundColor: `var(${ name })`,
					} }
				/>
			) }
		/>
	);
}

/**
 * Displays every public semantic color token with its description and a
 * swatch of the resolved color, grouped by property (background, foreground,
 * stroke) and target.
 */
export function ColorTokenPreview() {
	return (
		<div style={ previewStyle }>
			{ Object.entries( groups.color.groups ).map(
				( [ property, group ] ) => (
					<section key={ property } style={ sectionStyle }>
						<GroupTitle
							name={ property }
							id={ `color-${ property }` }
						/>
						{ Object.entries( group.groups ).map(
							( [ target, targetGroup ] ) => (
								<div key={ target }>
									<GroupTitle
										name={ target }
										id={ `color-${ property }-${ target }` }
										level={ 3 }
									/>
									<ColorTokenList
										names={ targetGroup.tokens }
									/>
								</div>
							)
						) }
						{ group.tokens.length > 0 && (
							<ColorTokenList names={ group.tokens } />
						) }
					</section>
				)
			) }
		</div>
	);
}
