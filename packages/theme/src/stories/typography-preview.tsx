import type { CSSProperties } from 'react';
import { GroupTitle } from './group-title';
import { groups, tokens } from '../../prebuilt/js/design-tokens.mjs';

type TypographyTokenGroup = {
	sampleLines: string[];
	getSampleStyle: ( tokenValue: string, tokenName: string ) => CSSProperties;
};

type TypographyGroupKey = keyof typeof groups.typography.groups;

const typographyConfig: Record< TypographyGroupKey, TypographyTokenGroup > = {
	'font-family': {
		sampleLines: [ 'Code is Poetry.' ],
		getSampleStyle: ( tokenValue ) => ( {
			fontFamily: tokenValue,
			fontSize: 'var(--wpds-typography-font-size-xl)',
			lineHeight: 'var(--wpds-typography-line-height-xl)',
		} ),
	},
	'font-size': {
		sampleLines: [ 'Code is Poetry.' ],
		getSampleStyle: ( tokenValue, tokenName ) => ( {
			fontFamily: 'var(--wpds-typography-font-family-heading)',
			fontSize: tokenValue,
			fontWeight: 'var(--wpds-typography-font-weight-default)',
			lineHeight: getTokenValue(
				tokenName.replace( '-font-size-', '-line-height-' )
			),
		} ),
	},
	'line-height': {
		sampleLines: [
			'WordPress grows when people like you tell their friends about it.',
			'Code is Poetry.',
		],
		getSampleStyle: ( tokenValue ) => ( {
			fontFamily: 'var(--wpds-typography-font-family-body)',
			fontSize: 'var(--wpds-typography-font-size-md)',
			lineHeight: tokenValue,
		} ),
	},
	'font-weight': {
		sampleLines: [ 'Code is Poetry.' ],
		getSampleStyle: ( tokenValue ) => ( {
			fontFamily: 'var(--wpds-typography-font-family-body)',
			fontSize: 'var(--wpds-typography-font-size-lg)',
			fontWeight: tokenValue,
			lineHeight: 'var(--wpds-typography-line-height-lg)',
		} ),
	},
};

const previewStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-3xl)',
	color: 'var(--wpds-color-foreground-content-neutral)',
};

const listStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-md)',
	margin: 0,
	padding: 0,
};

const itemStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-md)',
	padding: 'var(--wpds-dimension-padding-lg)',
	backgroundColor: 'var(--wpds-color-background-surface-neutral-weak)',
	border: 'var(--wpds-border-width-xs) solid var(--wpds-color-stroke-surface-neutral-weak)',
	borderRadius: 'var(--wpds-border-radius-sm)',
};

const tokenNameStyle: CSSProperties = {
	fontFamily: 'var(--wpds-typography-font-family-mono)',
	fontSize: 'var(--wpds-typography-font-size-sm)',
	fontStyle: 'normal',
	fontWeight: 'var(--wpds-typography-font-weight-default)',
	lineHeight: 'var(--wpds-typography-line-height-sm)',
	overflowWrap: 'anywhere',
};

const tokenNameContainerStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-xs)',
	margin: 0,
};

const descriptionStyle: CSSProperties = {
	fontSize: 'var(--wpds-typography-font-size-sm)',
	lineHeight: 'var(--wpds-typography-line-height-sm)',
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
};

const sampleStyle: CSSProperties = {
	margin: 0,
};

const sampleLineStyle: CSSProperties = {
	display: 'block',
	overflowWrap: 'anywhere',
};

function getTokenValue( tokenName: string ) {
	return `var(${ tokenName })`;
}

function TypographyTokenSection( {
	groupKey,
	tokenNames,
	sampleLines,
	getSampleStyle,
}: TypographyTokenGroup & {
	groupKey: string;
	tokenNames: readonly ( keyof typeof tokens )[];
} ) {
	const sectionTokens = tokenNames;

	return (
		<section>
			<GroupTitle name={ groupKey } />
			<dl style={ listStyle }>
				{ sectionTokens.map( ( tokenName ) => {
					const tokenValue = getTokenValue( tokenName );
					const tokenStyle = getSampleStyle( tokenValue, tokenName );

					return (
						<div key={ tokenName } style={ itemStyle }>
							<dt style={ tokenNameContainerStyle }>
								<code style={ tokenNameStyle }>
									{ tokenName }
								</code>
								<span style={ descriptionStyle }>
									{ tokens[ tokenName ].$description }
								</span>
							</dt>
							<dd style={ { margin: 0 } }>
								<p style={ sampleStyle }>
									{ sampleLines.map( ( line ) => (
										<span
											key={ line }
											style={ {
												...sampleLineStyle,
												...tokenStyle,
											} }
										>
											{ line }
										</span>
									) ) }
								</p>
							</dd>
						</div>
					);
				} ) }
			</dl>
		</section>
	);
}

/**
 * Displays every public typography token using its generated CSS custom
 * property.
 */
export function TypographyTokenPreview() {
	return (
		<div style={ previewStyle }>
			{ (
				Object.keys( groups.typography.groups ) as TypographyGroupKey[]
			 ).map( ( key ) => (
				<TypographyTokenSection
					key={ key }
					groupKey={ key }
					tokenNames={ groups.typography.groups[ key ].tokens }
					{ ...typographyConfig[ key ] }
				/>
			) ) }
		</div>
	);
}
