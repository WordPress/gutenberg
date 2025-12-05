/**
 * External dependencies
 */
import type { Plugin, TokenNormalized } from '@terrazzo/parser';
import { kebabCase } from '@terrazzo/token-tools';
import { transformCSSValue } from '@terrazzo/token-tools/css';
import {
	parse,
	to,
	serialize,
	sRGB,
	type ColorConstructor,
} from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import '../../src/color-ramps/lib/register-color-spaces';
import { FORMAT_JSON_ID } from './lib';
import { publicTokenId } from '../../src/token-id';

/**
 * Transforms a token ID to a Figma variable name including folders.
 *
 * Token IDs are transformed to match the CSS variable naming convention
 * (`--wpds-<type>-<property>-<target>[-<modifier>]`) but using `/` as
 * folder separators for the first 3 segments (type, property, target),
 * with remaining segments joined by dashes.
 *
 * Examples:
 * - `color.bg.surface.info.weak` → `wpds-color/bg/surface/info-weak`
 * - `dimension.padding.surface.sm` → `wpds-dimension/padding/surface/sm`
 * - `font.lineHeight.small` → `wpds-font/line-height/small`
 *
 * @param options    Options object.
 * @param options.id The token ID to transform.
 * @return The transformed token name.
 */
function transformTokenName( { id }: { id: string } ): string {
	const [ type, property, target, ...modifiers ] =
		publicTokenId( id ).split( '.' );

	return [
		`wpds-${ type }/${ kebabCase( property ) }`,
		target && kebabCase( target ),
		modifiers.map( kebabCase ).join( '-' ),
	]
		.filter( Boolean )
		.join( '/' );
}

function transformColorToken(
	token: TokenNormalized,
	mode: string,
	tokens: Record< string, TokenNormalized >
) {
	if (
		token.mode[ mode ]?.aliasChain &&
		token.mode[ mode ].aliasChain.length > 0
	) {
		// Keep aliases
		return `{${ transformTokenName( {
			id: token.mode[ mode ].aliasChain[ 0 ],
		} ) }}`;
	}
	// Start by letting terrazzo do the heavy lifting.
	const baselineCSSValue = transformCSSValue( token, {
		mode,
		tokensSet: tokens,
		transformAlias: transformTokenName,
	} );

	if ( baselineCSSValue === undefined ) {
		console.warn( 'Unexpected: could not tranform color token value' );
		return;
	}

	let cssColorValue: string;

	if ( typeof baselineCSSValue === 'object' ) {
		if ( 'srgb' in baselineCSSValue ) {
			// Pick SRGB gamut (safer compared to p3 or rec2020)
			cssColorValue = baselineCSSValue.srgb;
		} else {
			console.log( 'UNSUPPORTED USE CASE' );
			return;
		}
	} else {
		cssColorValue = baselineCSSValue;
	}

	// Always convert to hex
	// (easier to convert to Figma RGB, and includes clamping)
	let convertedColor: ColorConstructor;
	try {
		convertedColor = parse( cssColorValue );
	} catch {
		console.warn( 'Unexpected: could not convert token value to Color' );
		return;
	}

	return serialize( to( convertedColor, sRGB ), { format: 'hex' } );
}

export default function pluginFigmaDsTokenManager( {
	filename = 'figma-ds-tokens.json',
} = {} ): Plugin {
	return {
		name: '@terrazzo/plugin-figma-ds-token-manager',
		async transform( { tokens, getTransforms, setTransform } ) {
			// skip work if another .json plugin has already run
			const jsonTokens = getTransforms( {
				format: FORMAT_JSON_ID,
				id: '*',
				mode: '.',
			} );
			if ( jsonTokens.length ) {
				return;
			}

			for ( const [ id, token ] of Object.entries( tokens ) ) {
				for ( const mode of Object.keys( token.mode ) ) {
					const localID = transformTokenName( token );

					let transformedValue;

					if ( token.$type === 'color' ) {
						transformedValue = transformColorToken(
							token,
							mode,
							tokens
						);
					} else if (
						token.mode[ mode ]?.aliasChain &&
						token.mode[ mode ].aliasChain.length > 0
					) {
						// Keep aliases
						transformedValue = `{${ transformTokenName( {
							id: token.mode[ mode ].aliasChain[ 0 ],
						} ) }}`;
					} else {
						// Fallback to terrazzo
						transformedValue = transformCSSValue( token, {
							mode,
							tokensSet: tokens,
							transformAlias: transformTokenName,
						} );
					}

					if ( transformedValue !== undefined ) {
						setTransform( id, {
							format: FORMAT_JSON_ID,
							localID,
							value: transformedValue,
							mode,
						} );
					}
				}
			}
		},
		async build( { getTransforms, outputFile } ) {
			const tokenVals: Record<
				string,
				{
					value: Record< string, string | Record< string, string > >;
					description?: string;
				}
			> = {};

			for ( const token of getTransforms( {
				format: FORMAT_JSON_ID,
				id: '*',
			} ) ) {
				if ( ! token.localID ) {
					continue;
				}

				tokenVals[ token.localID ] ??= { value: {}, description: '' };

				tokenVals[ token.localID ].value[ token.mode ] = token.value;
				tokenVals[ token.localID ].description =
					token.token.$description;
			}

			outputFile( filename, JSON.stringify( tokenVals, null, 2 ) );
		},
	};
}
