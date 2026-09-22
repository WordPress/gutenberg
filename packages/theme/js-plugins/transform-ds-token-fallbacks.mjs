import { parse } from '@babel/parser';
import { isTSType, traverse } from '@babel/types';
import MagicString from 'magic-string';
import { addFallbackToVar } from '../postcss-plugins/ds-token-fallbacks.mjs';

/**
 * Whether an ancestor makes a literal part of a name, module path, or type.
 *
 * @param {import('@babel/types').TraversalAncestors} ancestors Ancestors.
 * @return {boolean} Whether to leave the literal alone.
 */
function isNonValue( ancestors ) {
	return ancestors.some( ( { node, key } ) => {
		if ( isTSType( node ) ) {
			return true;
		}
		if (
			[ 'source', 'key', 'property', 'imported', 'exported' ].includes(
				key
			)
		) {
			return true;
		}
		return (
			node.type === 'ImportAttribute' ||
			( node.type === 'TSModuleDeclaration' && key === 'id' ) ||
			node.type === 'TSExternalModuleReference' ||
			node.type === 'ImportExpression' ||
			( node.type === 'CallExpression' &&
				( node.callee.type === 'Import' ||
					( node.callee.type === 'Identifier' &&
						node.callee.name === 'require' ) ) )
		);
	} );
}

/**
 * Inject fallbacks into JavaScript values without rewriting other source text.
 * The caller is responsible for composing the returned source map.
 *
 * @param {string} source   JavaScript or TypeScript source.
 * @param {string} filename Source filename, without a query string.
 * @return {{ code: string, map: import('magic-string').SourceMap } | null} Transformation, or null when unchanged.
 */
export function transformDsTokenFallbacks( source, filename ) {
	if ( ! source.includes( '--wpds-' ) ) {
		return null;
	}

	const isTypeScript = /\.[mc]?tsx?$/.test( filename );
	const ast = parse( source, {
		sourceType: 'unambiguous',
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
		allowUndeclaredExports: true,
		attachComment: false,
		plugins: [
			...( isTypeScript
				? [ /** @type {const} */ ( 'typescript' ) ]
				: [] ),
			...( /\.[mc]?ts$/.test( filename )
				? []
				: [ /** @type {const} */ ( 'jsx' ) ] ),
			'decorators',
		],
	} );
	const output = new MagicString( source );

	traverse( ast, ( node, ancestors ) => {
		if (
			( node.type !== 'StringLiteral' &&
				node.type !== 'TemplateElement' ) ||
			typeof node.start !== 'number' ||
			typeof node.end !== 'number' ||
			isNonValue( ancestors )
		) {
			return;
		}

		if ( node.type === 'StringLiteral' ) {
			const value = addFallbackToVar( node.value );
			if ( value === node.value ) {
				return;
			}
			// JSX attribute strings use HTML entities, not JavaScript escapes.
			const replacement = JSON.stringify( value );
			output.overwrite(
				node.start,
				node.end,
				ancestors.at( -1 )?.node.type === 'JSXAttribute'
					? `{${ replacement }}`
					: replacement
			);
			return;
		}

		// Tags can observe raw text, including String.raw and CSS-in-JS tags.
		// Preserve their existing escapes and insert the CSS fallback verbatim.
		const tagged =
			ancestors.at( -2 )?.node.type === 'TaggedTemplateExpression';
		const original = tagged ? node.value.raw : node.value.cooked;
		if ( typeof original !== 'string' ) {
			return;
		}
		const value = addFallbackToVar( original );
		if ( value !== original ) {
			output.overwrite(
				node.start,
				node.end,
				tagged
					? value
					: JSON.stringify( value )
							.slice( 1, -1 )
							.replaceAll( '\\"', '"' )
							.replaceAll( '`', '\\`' )
							.replaceAll( '${', '\\${' )
			);
		}
	} );

	if ( ! output.hasChanged() ) {
		return null;
	}
	return {
		code: output.toString(),
		map: output.generateMap( {
			source: filename,
			includeContent: true,
			hires: true,
		} ),
	};
}
