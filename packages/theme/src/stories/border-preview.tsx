import type { CSSProperties } from 'react';
import { borderGroups } from './token-data';
import {
	descriptionStyle,
	headingStyle,
	itemStyle,
	listStyle,
	previewStyle,
	textStyle,
	tokenNameStyle,
} from './token-preview-styles';

const groupTitles: Record< string, string > = {
	width: 'Width',
	radius: 'Radius',
};

const widthExampleStyle = ( name: string ): CSSProperties => ( {
	display: 'block',
	width: '100%',
	height: 0,
	borderBlockStart: `var(${ name }) solid var(--wpds-color-foreground-content-neutral)`,
} );

const radiusExampleStyle = ( name: string ): CSSProperties => ( {
	display: 'block',
	width: 'var(--wpds-dimension-size-lg)',
	height: 'var(--wpds-dimension-size-lg)',
	backgroundColor: 'var(--wpds-color-background-surface-brand)',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-interactive-brand)',
	borderRadius: `var(${ name })`,
} );

/**
 * Displays the border width tokens as lines and the border radius tokens as
 * the corners of a box.
 */
export function BorderTokenPreview() {
	return (
		<div style={ previewStyle }>
			{ [ 'width', 'radius' ].map( ( kind ) => {
				const group = borderGroups.find(
					( { path } ) => path[ 0 ] === kind
				);
				if ( ! group ) {
					return null;
				}
				return (
					<section key={ kind }>
						<h2 style={ headingStyle }>{ groupTitles[ kind ] }</h2>
						<dl style={ listStyle }>
							{ group.tokens.map( ( { name, description } ) => (
								<div key={ name } style={ itemStyle }>
									<dd
										style={ { margin: 0 } }
										aria-hidden="true"
									>
										<span
											style={
												kind === 'width'
													? widthExampleStyle( name )
													: radiusExampleStyle( name )
											}
										/>
									</dd>
									<dt style={ textStyle }>
										<code style={ tokenNameStyle }>
											{ name }
										</code>
										<span style={ descriptionStyle }>
											{ description }
										</span>
									</dt>
								</div>
							) ) }
						</dl>
					</section>
				);
			} ) }
		</div>
	);
}
