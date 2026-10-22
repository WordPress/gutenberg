import type { CSSProperties } from 'react';
import { GroupTitle } from './group-title';
import { TokenTable } from './token-table';
import { previewStyle } from './token-preview-styles';
import { groups } from '../../prebuilt/js/design-tokens.mjs';

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
	tokenNames: readonly string[];
} ) {
	const sectionTokens = tokenNames;

	return (
		<section>
			<GroupTitle name={ groupKey } id={ `typography-${ groupKey }` } />
			<TokenTable
				names={ sectionTokens }
				sampleWidth="32%"
				tokenWidth="36%"
				renderSample={ ( tokenName ) => {
					const tokenStyle = getSampleStyle(
						getTokenValue( tokenName ),
						tokenName
					);
					return (
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
					);
				} }
			/>
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
