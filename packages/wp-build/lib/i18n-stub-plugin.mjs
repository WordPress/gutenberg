import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseSync, Visitor } from 'rolldown/utils';

/*
 * Translation stubs.
 *
 * A `--no-script-debug` build ships only the minified `*.min.js` files, which
 * `wp i18n make-pot` skips. This plugin collects every i18n call of the
 * modules that end up in a bundle, with its translator comment, from the
 * original sources, and writes them next to the bundle as a small stub at the
 * unminified path (`index.min.js` -> `index.js`). `make-pot` then extracts the
 * strings with references to the unminified path, which is the path that
 * `load_script_textdomain()` hashes to find the JSON translations of
 * `index.min.js`.
 */

/**
 * Argument layout of the i18n functions: which arguments are translatable
 * strings that must be literals, and where the text domain is.
 */
const I18N_FUNCTIONS = {
	__: { strings: [ 0 ], domain: 1 },
	_x: { strings: [ 0, 1 ], domain: 2 },
	_n: { strings: [ 0, 1 ], number: 2, domain: 3 },
	_nx: { strings: [ 0, 1, 3 ], number: 2, domain: 4 },
};

const I18N_CALL_HINT = /\b_(?:_|x|n|nx)\b/;
const TRANSLATORS_COMMENT = /^[\s*]*translators:/i;

/** @type {Map<string, Array<{ fn: string, args: Array<string|null>, comment?: string }>>} */
const extractionCache = new Map();

/**
 * Get the name of the called function for `__()`, `i18n.__()`, `( 0, i18n.__ )()`.
 *
 * @param {Object} callee Callee node.
 * @return {string|undefined} Function name.
 */
function getCalleeName( callee ) {
	while ( callee ) {
		switch ( callee.type ) {
			case 'Identifier':
				return callee.name;
			case 'MemberExpression':
				return callee.computed ? undefined : callee.property.name;
			case 'ParenthesizedExpression':
			case 'TSAsExpression':
			case 'TSNonNullExpression':
				callee = callee.expression;
				break;
			case 'SequenceExpression':
				callee = callee.expressions.at( -1 );
				break;
			default:
				return undefined;
		}
	}
	return undefined;
}

/**
 * Get the value of a string argument, if it is static.
 *
 * @param {Object} node Argument node.
 * @return {string|null} String value, or null when it is not static.
 */
function getStaticString( node ) {
	if ( ! node ) {
		return null;
	}
	switch ( node.type ) {
		case 'Literal':
			return typeof node.value === 'string' ? node.value : null;
		case 'TemplateLiteral':
			return node.expressions.length === 0
				? node.quasis.map( ( quasi ) => quasi.value.cooked ).join( '' )
				: null;
		case 'BinaryExpression': {
			if ( node.operator !== '+' ) {
				return null;
			}
			const left = getStaticString( node.left );
			const right = getStaticString( node.right );
			return left === null || right === null ? null : left + right;
		}
		case 'ParenthesizedExpression':
		case 'TSAsExpression':
			return getStaticString( node.expression );
		default:
			return null;
	}
}

/**
 * Find the original source of a module: the file its source map points to
 * (e.g. `src/foo.ts` for a transpiled `build-module/foo.mjs`), or the module
 * itself.
 *
 * @param {string} id   Module id (absolute path).
 * @param {string} code Module code, as passed to the transform hook.
 * @return {{ filename: string, code: string }} Original source.
 */
function getOriginalSource( id, code ) {
	const mapFile = `${ id }.map`;
	if ( existsSync( mapFile ) ) {
		try {
			const map = JSON.parse( readFileSync( mapFile, 'utf8' ) );
			if ( map.sources?.length === 1 ) {
				const sourceFile = path.resolve(
					path.dirname( mapFile ),
					map.sourceRoot || '',
					map.sources[ 0 ]
				);
				if ( existsSync( sourceFile ) ) {
					return {
						filename: sourceFile,
						code: readFileSync( sourceFile, 'utf8' ),
					};
				}
				if ( typeof map.sourcesContent?.[ 0 ] === 'string' ) {
					return {
						filename: sourceFile,
						code: map.sourcesContent[ 0 ],
					};
				}
			}
		} catch {
			// Fall back to the module itself.
		}
	}
	return { filename: id, code };
}

/**
 * Extract the i18n calls of a source file with their translator comments.
 *
 * A translator comment belongs to the first i18n call that follows it within
 * a few lines, which matches how translator comments are written in practice
 * (directly above the call, or above the statement that contains it).
 *
 * @param {string} filename File name, which determines the parser language.
 * @param {string} code     Source code.
 * @return {Array<{ fn: string, args: Array<string|null>, comment?: string }>} Calls.
 */
export function extractI18nCalls( filename, code ) {
	if ( ! I18N_CALL_HINT.test( code ) ) {
		return [];
	}

	const { program, comments, errors } = parseSync( filename, code );
	if ( errors.some( ( error ) => error.severity === 'Error' ) && ! program ) {
		return [];
	}

	const calls = [];
	new Visitor( {
		CallExpression( node ) {
			const fn = getCalleeName( node.callee );
			const layout =
				Object.hasOwn( I18N_FUNCTIONS, fn ) && I18N_FUNCTIONS[ fn ];
			if ( ! layout ) {
				return;
			}
			const args = [];
			for ( const index of layout.strings ) {
				const value = getStaticString( node.arguments[ index ] );
				if ( value === null ) {
					// Not extractable by make-pot either.
					return;
				}
				args[ index ] = value;
			}
			if ( layout.number !== undefined ) {
				args[ layout.number ] = null;
			}
			const domain = getStaticString( node.arguments[ layout.domain ] );
			if ( domain !== null ) {
				args[ layout.domain ] = domain;
			}
			calls.push( { fn, args, start: node.start } );
		},
	} ).visit( program );

	calls.sort( ( a, b ) => a.start - b.start );

	const lineStarts = [ 0 ];
	for ( let i = 0; i < code.length; i++ ) {
		if ( code.charCodeAt( i ) === 10 ) {
			lineStarts.push( i + 1 );
		}
	}
	const lineAt = ( offset ) => {
		let low = 0;
		let high = lineStarts.length - 1;
		while ( low < high ) {
			const mid = Math.ceil( ( low + high ) / 2 );
			if ( lineStarts[ mid ] <= offset ) {
				low = mid;
			} else {
				high = mid - 1;
			}
		}
		return low + 1;
	};

	let callIndex = 0;
	for ( const comment of comments ) {
		if ( ! TRANSLATORS_COMMENT.test( comment.value ) ) {
			continue;
		}
		while (
			callIndex < calls.length &&
			calls[ callIndex ].start < comment.end
		) {
			callIndex++;
		}
		const call = calls[ callIndex ];
		if (
			call &&
			call.comment === undefined &&
			lineAt( call.start ) - lineAt( comment.end ) <= 3
		) {
			call.comment = comment.value.trim();
		}
	}

	return calls.map( ( { fn, args, comment } ) => ( { fn, args, comment } ) );
}

/**
 * Render a stub file.
 *
 * @param {string} stubName   File name of the stub.
 * @param {string} bundleName File name of the real bundle.
 * @param {Array}  calls      i18n calls.
 * @return {string} Stub source.
 */
function renderStub( stubName, bundleName, calls ) {
	const lines = [
		'/*',
		` * Translation stub generated by @wordpress/build for ${ bundleName }.`,
		' * It lists the translatable strings of that file for `wp i18n make-pot`',
		' * and is never meant to run: load the minified file instead.',
		' */',
		`throw new Error( ${ JSON.stringify(
			`${ stubName } is a translation stub. Load ${ bundleName } instead.`
		) } );`,
	];
	const seen = new Set();
	for ( const { fn, args, comment } of calls ) {
		const renderedArgs = [];
		for ( const arg of args ) {
			// The number argument of `_n()` and `_nx()` is not extracted.
			renderedArgs.push( arg === null ? '0' : JSON.stringify( arg ) );
		}
		const statement = `${ fn }(${ renderedArgs.join( ',' ) });`;
		const entry = comment
			? `/* ${ comment.replace( /\*\//g, '* /' ) } */\n${ statement }`
			: statement;
		if ( ! seen.has( entry ) ) {
			seen.add( entry );
			lines.push( entry );
		}
	}
	return lines.join( '\n' ) + '\n';
}

/**
 * Rolldown plugin that writes a translation stub next to each bundle.
 *
 * @return {import('rolldown').Plugin} Rolldown plugin.
 */
export function i18nStubPlugin() {
	/** @type {Map<string, Array>} */
	const moduleCalls = new Map();

	return {
		name: 'wp-build-i18n-stub',
		transform: {
			filter: { id: /\.[cm]?[jt]sx?$/ },
			handler( code, id ) {
				if ( id.startsWith( '\0' ) ) {
					return null;
				}
				let calls = extractionCache.get( id );
				if ( ! calls ) {
					const original = getOriginalSource( id, code );
					calls = extractI18nCalls(
						original.filename,
						original.code
					);
					extractionCache.set( id, calls );
				}
				if ( calls.length ) {
					moduleCalls.set( id, calls );
				}
				return null;
			},
		},
		generateBundle( _outputOptions, bundle ) {
			for ( const chunk of Object.values( bundle ) ) {
				if ( chunk.type !== 'chunk' ) {
					continue;
				}
				const calls = [];
				for ( const [ id, info ] of Object.entries( chunk.modules ) ) {
					// Skip modules that were tree-shaken out entirely.
					if ( info.renderedLength > 0 && moduleCalls.has( id ) ) {
						calls.push( ...moduleCalls.get( id ) );
					}
				}
				if ( ! calls.length ) {
					continue;
				}
				const stubName = chunk.fileName.replace(
					/(?:\.min)?\.js$/,
					'.js'
				);
				if ( stubName === chunk.fileName ) {
					continue;
				}
				this.emitFile( {
					type: 'asset',
					fileName: stubName,
					source: renderStub(
						path.basename( stubName ),
						path.basename( chunk.fileName ),
						calls
					),
				} );
			}
		},
	};
}
