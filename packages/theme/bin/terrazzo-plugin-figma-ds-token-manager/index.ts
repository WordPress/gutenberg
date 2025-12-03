/**
 * External dependencies
 */
import type { Plugin, TokenNormalized } from '@terrazzo/parser';
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

function titleCase( str: string ) {
	return str[ 0 ].toUpperCase() + str.slice( 1 );
}

function kebabToCamel( str: string ) {
	return str.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

function transformTokenName( { id }: { id: string } ) {
	return (
		id
			// Capitalize first segment
			.replace( /^(\w+)\./g, ( _, g1 ) => `${ titleCase( g1 ) }/` )
			// Capitalize
			.replace( /primitive\./g, '_Primitives/' )
			.replace( /semantic\./g, 'Semantic/' )
			.replace(
				/(color\/_Primitives)\/(\w+)\.(.*)/gi,
				( _, prefix, tone, rampStep ) => {
					return `${ prefix }/${ titleCase( tone ) }/${ rampStep }`;
				}
			)
			// Color-specific transformation for semantic tokens:
			// - add extra folder (Background, Foreground, Stroke)
			// - swap "tone" folder order, capitalize
			// - limit bg-* to 6 characters
			// - keep last part of the token name with dots (eg no folders)
			.replace(
				/(color\/Semantic)\/([\w,\-]+)\.(\w+)\.(.*)/gi,
				( _, prefix, element, tone, emphasisAndState ) => {
					let extraFolder = '';
					let elementName = element;
					if ( /bg/.test( element ) ) {
						extraFolder = 'Background/';
						elementName = element.slice( 0, 6 );
					} else if ( /fg/.test( element ) ) {
						extraFolder = 'Foreground/';
						elementName = element.slice( 0, 6 );
					} else if ( /stroke/.test( element ) ) {
						extraFolder = 'Stroke/';
						elementName = element.slice( 0, 10 );
					}
					return `${ prefix }/${ extraFolder }${ titleCase(
						tone
					) }/${ kebabToCamel(
						elementName
					) }.${ tone }.${ emphasisAndState }`;
				}
			)
			// Remove default emphasis and state variants from variable name
			.replace( /normal\./g, '' )
			.replace( /resting/g, '' )
			// Remove double dots
			.replace( /\.{2,}/g, '.' )
			// Remove trailing dot
			.replace( /\.$/g, '' )
			// Replace remaining dots with dashes
			.replace( /\./g, '-' )
	);
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
