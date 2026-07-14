import type { CSSProperties } from 'react';
import _tokenFallbacks from '../prebuilt/js/design-token-fallbacks.mjs';
import wpdsTokens from '../prebuilt/js/design-tokens.mjs';

const tokenFallbacks: Record< string, string > = _tokenFallbacks;

type TypographyTokenGroup = {
	title: string;
	description: string;
	tokenPrefix: string;
	sampleLines: string[];
	getSampleStyle: ( tokenValue: string ) => CSSProperties;
};

const tokenGroups: TypographyTokenGroup[] = [
	{
		title: 'Font families',
		description:
			'Compare the heading, body, and monospace font family roles.',
		tokenPrefix: '--wpds-typography-font-family-',
		sampleLines: [ 'Code is Poetry.' ],
		getSampleStyle: ( tokenValue ) => ( {
			fontFamily: tokenValue,
			fontSize: 'var(--wpds-typography-font-size-xl)',
			lineHeight: 'var(--wpds-typography-line-height-xl)',
		} ),
	},
	{
		title: 'Font sizes',
		description: 'Compare each step in the typography size scale.',
		tokenPrefix: '--wpds-typography-font-size-',
		sampleLines: [ 'Code is Poetry.' ],
		getSampleStyle: ( tokenValue ) => ( {
			fontFamily: 'var(--wpds-typography-font-family-heading)',
			fontSize: tokenValue,
			fontWeight: 'var(--wpds-typography-font-weight-emphasis)',
		} ),
	},
	{
		title: 'Line heights',
		description: 'Compare the vertical rhythm of each line-height token.',
		tokenPrefix: '--wpds-typography-line-height-',
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
	{
		title: 'Font weights',
		description: 'Compare the default and emphasis font weight roles.',
		tokenPrefix: '--wpds-typography-font-weight-',
		sampleLines: [ 'Code is Poetry.' ],
		getSampleStyle: ( tokenValue ) => ( {
			fontFamily: 'var(--wpds-typography-font-family-body)',
			fontSize: 'var(--wpds-typography-font-size-lg)',
			fontWeight: tokenValue,
			lineHeight: 'var(--wpds-typography-line-height-lg)',
		} ),
	},
];

const previewStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--wpds-dimension-gap-3xl)',
	color: 'var(--wpds-color-foreground-content-neutral)',
};

const headingStyle: CSSProperties = {
	marginBlockEnd: 'var(--wpds-dimension-gap-xs)',
};

const descriptionStyle: CSSProperties = {
	marginBlockStart: 0,
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
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

const sampleStyle: CSSProperties = {
	margin: 0,
};

const sampleLineStyle: CSSProperties = {
	display: 'block',
	overflowWrap: 'anywhere',
};

function getTokenValue( tokenName: string ) {
	const fallback = tokenFallbacks[ tokenName ];

	if ( ! fallback ) {
		throw new Error(
			`TypographyTokenPreview: Missing fallback for ${ tokenName }.`
		);
	}

	return `var(${ tokenName }, ${ fallback })`;
}

function TypographyTokenSection( {
	title,
	description,
	tokenPrefix,
	sampleLines,
	getSampleStyle,
}: TypographyTokenGroup ) {
	const tokens = wpdsTokens.filter( ( tokenName ) =>
		tokenName.startsWith( tokenPrefix )
	);

	return (
		<section>
			<h2 style={ headingStyle }>{ title }</h2>
			<p style={ descriptionStyle }>{ description }</p>
			<dl style={ listStyle }>
				{ tokens.map( ( tokenName ) => {
					const tokenValue = getTokenValue( tokenName );
					const tokenStyle = getSampleStyle( tokenValue );

					return (
						<div key={ tokenName } style={ itemStyle }>
							<dt>
								<code style={ tokenNameStyle }>
									{ tokenName }
								</code>
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
			{ tokenGroups.map( ( tokenGroup ) => (
				<TypographyTokenSection
					key={ tokenGroup.tokenPrefix }
					{ ...tokenGroup }
				/>
			) ) }
		</div>
	);
}
