import type { CSSProperties } from 'react';
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

const swatchStyle: CSSProperties = {
	display: 'block',
	width: '100%',
	aspectRatio: '2 / 1',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral)',
	borderRadius: 'var(--wpds-border-radius-sm)',
};

const sectionStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-3xl)',
};

const sectionTitleStyle: CSSProperties = {
	margin: 0,
	textTransform: 'capitalize',
};

const titleCase = ( key: string ) => {
	const text = key.replace( /-/g, ' ' );
	return text.charAt( 0 ).toUpperCase() + text.slice( 1 );
};

function ColorTokenList( { names }: { names: readonly string[] } ) {
	return (
		<dl style={ listStyle }>
			{ names.map( ( name ) => (
				<div key={ name } style={ itemStyle }>
					<dd style={ { margin: 0 } } aria-hidden="true">
						<span
							style={ {
								...swatchStyle,
								backgroundColor: `var(${ name })`,
							} }
						/>
					</dd>
					<dt style={ textStyle }>
						<code style={ tokenNameStyle }>{ name }</code>
						<span style={ descriptionStyle }>
							{ tokens[ name ].$description }
						</span>
					</dt>
				</div>
			) ) }
		</dl>
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
						<h2 style={ sectionTitleStyle }>{ property }</h2>
						{ Object.entries( group.groups ).map(
							( [ target, targetGroup ] ) => (
								<div key={ target }>
									<h3 style={ headingStyle }>
										{ titleCase( target ) }
									</h3>
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
