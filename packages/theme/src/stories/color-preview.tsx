import type { CSSProperties } from 'react';
import { colorGroups, pathTitle } from './token-data';
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

const sectionTitleStyle: CSSProperties = {
	...headingStyle,
	textTransform: 'capitalize',
};

/**
 * Displays every public semantic color token with its description and a
 * swatch of the resolved color, grouped by property (background, foreground,
 * stroke) and target.
 */
export function ColorTokenPreview() {
	const properties = [
		...new Set( colorGroups.map( ( { path } ) => path[ 0 ] ) ),
	];

	return (
		<div style={ previewStyle }>
			{ properties.map( ( property ) => (
				<section key={ property }>
					<h2 style={ sectionTitleStyle }>{ property }</h2>
					{ colorGroups
						.filter( ( { path } ) => path[ 0 ] === property )
						.map( ( { path, tokens } ) => (
							<div key={ path.join( '/' ) }>
								{ path.length > 1 && (
									<h3 style={ headingStyle }>
										{ pathTitle( path.slice( 1 ) ) }
									</h3>
								) }
								<dl style={ listStyle }>
									{ tokens.map( ( { name, description } ) => (
										<div key={ name } style={ itemStyle }>
											<dd
												style={ { margin: 0 } }
												aria-hidden="true"
											>
												<span
													style={ {
														...swatchStyle,
														backgroundColor: `var(${ name })`,
													} }
												/>
											</dd>
											<dt style={ textStyle }>
												<code style={ tokenNameStyle }>
													{ name }
												</code>
												<span
													style={ descriptionStyle }
												>
													{ description }
												</span>
											</dt>
										</div>
									) ) }
								</dl>
							</div>
						) ) }
				</section>
			) ) }
		</div>
	);
}
