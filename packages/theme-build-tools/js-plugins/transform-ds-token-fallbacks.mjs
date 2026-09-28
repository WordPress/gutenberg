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
			[
				'source',
				'key',
				'property',
				'imported',
				'exported',
				'local',
			].includes( key )
		) {
			return true;
		}
		return (
			node.type === 'ImportAttribute' ||
			( ( node.type === 'TSModuleDeclaration' ||
				node.type === 'TSEnumMember' ) &&
				key === 'id' ) ||
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
 * @return {{ code: string, map: import('magic-string').SourceMap, sourceMappingURL: string | undefined } | null} Transformation, or null when unchanged or unparseable.
 */
export function transformDsTokenFallbacks( source, filename ) {
	if ( ! source.includes( '--wpds-' ) ) {
		return null;
	}

	const isTypeScript = /\.[mc]?tsx?$/.test( filename );
	/** @type {import('@babel/parser').ParserOptions} */
	const options = {
		sourceType: 'unambiguous',
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
		allowUndeclaredExports: true,
		attachComment: false,
		errorRecovery: true,
		plugins: [
			...( isTypeScript
				? [ /** @type {const} */ ( 'typescript' ) ]
				: [] ),
			...( /\.[mc]?ts$/.test( filename )
				? []
				: [ /** @type {const} */ ( 'jsx' ) ] ),
			'decorators',
			'decoratorAutoAccessors',
			'deprecatedImportAssert',
			'sourcePhaseImports',
			'deferredImportEvaluation',
		],
	};
	let parserSource = source;
	/** @type {ReturnType<typeof parse>} */
	let ast;
	for (;;) {
		try {
			ast = parse( parserSource, options );
			// Unambiguous parsing can retain module errors in a valid script.
			if ( ast.program.sourceType === 'script' && ast.errors?.length ) {
				ast = parse( parserSource, {
					...options,
					sourceType: 'script',
				} );
			}
			break;
		} catch ( error ) {
			const parseError =
				/** @type {import('@babel/parser').ParseError} */ ( error );
			if ( parseError.code !== 'BABEL_PARSER_SYNTAX_ERROR' ) {
				throw error;
			}
			if (
				! isTypeScript ||
				! [ 'UnexpectedLeadingDecorator', 'UnexpectedToken' ].includes(
					parseError.reasonCode
				) ||
				! Number.isInteger( parseError.pos ) ||
				parserSource[ parseError.pos ] !== '!'
			) {
				// A later compiler plugin may understand syntax Babel does not.
				return null;
			}
			// Babel's decorator grammar rejects TypeScript non-null assertions.
			// Mask only the rejected token for parsing, preserving source offsets.
			// The downstream compiler still receives the original assertion.
			parserSource =
				parserSource.slice( 0, parseError.pos ) +
				' ' +
				parserSource.slice( parseError.pos + 1 );
		}
	}
	// Babel's standard decorators grammar reports parameter decorators even
	// in TypeScript. Leave that one check to the compiler's tsconfig settings.
	for ( const error of ast.errors ?? [] ) {
		if (
			! isTypeScript ||
			error.reasonCode !== 'UnsupportedParameterDecorator'
		) {
			return null;
		}
	}
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
			// Keep JSX literals as literals: JSX compilers can normalize their
			// whitespace differently from JavaScript expression values.
			const isAttribute =
				ancestors.at( -1 )?.node.type === 'JSXAttribute';
			output.overwrite(
				node.start,
				node.end,
				isAttribute
					? `"${ value.replaceAll( '&', '&amp;' ).replaceAll( '"', '&quot;' ) }"`
					: JSON.stringify( value )
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
	// Read actual comments, not directive-shaped text inside strings/templates.
	let sourceMappingURL;
	for ( const comment of ast.comments ?? [] ) {
		const match = /^[#@]\s*sourceMappingURL=(\S+)\s*$/.exec(
			comment.value
		);
		if ( match ) {
			sourceMappingURL = match[ 1 ];
		}
	}
	return {
		code: output.toString(),
		sourceMappingURL,
		map: output.generateMap( {
			source: filename,
			includeContent: true,
			hires: true,
		} ),
	};
}
