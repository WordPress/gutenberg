/**
 * This code is derived from the following projects:
 *
 * 1. dynamic-importmap (https://github.com/keller-mark/dynamic-importmap)
 * 2. es-module-shims (https://github.com/guybedford/es-module-shims)
 *
 * The original implementation was created by Guy Bedford in es-module-shims,
 * then adapted by Mark Keller in dynamic-importmap, and further modified
 * for use in this project.
 *
 * Both projects are licensed under the MIT license.
 *
 * MIT License: https://opensource.org/licenses/MIT
 */

const backslashRegEx = /\\/g;

function isURL( url: string ) {
	if ( url.indexOf( ':' ) === -1 ) {
		return false;
	}
	try {
		new URL( url );
		return true;
	} catch ( _ ) {
		return false;
	}
}

function resolveIfNotPlainOrUrl( relUrl, parentUrl ) {
	const hIdx = parentUrl.indexOf( '#' ),
		qIdx = parentUrl.indexOf( '?' );
	if ( hIdx + qIdx > -2 ) {
		parentUrl = parentUrl.slice(
			0,
			// eslint-disable-next-line no-nested-ternary
			hIdx === -1 ? qIdx : qIdx === -1 || qIdx > hIdx ? hIdx : qIdx
		);
	}
	if ( relUrl.indexOf( '\\' ) !== -1 ) {
		relUrl = relUrl.replace( backslashRegEx, '/' );
	}
	// protocol-relative
	if ( relUrl[ 0 ] === '/' && relUrl[ 1 ] === '/' ) {
		return parentUrl.slice( 0, parentUrl.indexOf( ':' ) + 1 ) + relUrl;
	}
	// relative-url
	else if (
		( relUrl[ 0 ] === '.' &&
			( relUrl[ 1 ] === '/' ||
				( relUrl[ 1 ] === '.' &&
					( relUrl[ 2 ] === '/' ||
						( relUrl.length === 2 && ( relUrl += '/' ) ) ) ) ||
				( relUrl.length === 1 && ( relUrl += '/' ) ) ) ) ||
		relUrl[ 0 ] === '/'
	) {
		const parentProtocol = parentUrl.slice(
			0,
			parentUrl.indexOf( ':' ) + 1
		);
		// Disabled, but these cases will give inconsistent results for deep backtracking
		//if (parentUrl[parentProtocol.length] !== '/')
		//  throw new Error('Cannot resolve');
		// read pathname from parent URL
		// pathname taken to be part after leading "/"
		let pathname;
		if ( parentUrl[ parentProtocol.length + 1 ] === '/' ) {
			// resolving to a :// so we need to read out the auth and host
			if ( parentProtocol !== 'file:' ) {
				pathname = parentUrl.slice( parentProtocol.length + 2 );
				pathname = pathname.slice( pathname.indexOf( '/' ) + 1 );
			} else {
				pathname = parentUrl.slice( 8 );
			}
		} else {
			// resolving to :/ so pathname is the /... part
			pathname = parentUrl.slice(
				parentProtocol.length +
					( parentUrl[ parentProtocol.length ] === '/' )
			);
		}

		if ( relUrl[ 0 ] === '/' ) {
			return (
				parentUrl.slice( 0, parentUrl.length - pathname.length - 1 ) +
				relUrl
			);
		}

		// join together and split for removal of .. and . segments
		// looping the string instead of anything fancy for perf reasons
		// '../../../../../z' resolved to 'x/y' is just 'z'
		const segmented =
			pathname.slice( 0, pathname.lastIndexOf( '/' ) + 1 ) + relUrl;

		const output = [];
		let segmentIndex = -1;
		for ( let i = 0; i < segmented.length; i++ ) {
			// busy reading a segment - only terminate on '/'
			if ( segmentIndex !== -1 ) {
				if ( segmented[ i ] === '/' ) {
					output.push( segmented.slice( segmentIndex, i + 1 ) );
					segmentIndex = -1;
				}
				continue;
			}
			// new segment - check if it is relative
			else if ( segmented[ i ] === '.' ) {
				// ../ segment
				if (
					segmented[ i + 1 ] === '.' &&
					( segmented[ i + 2 ] === '/' || i + 2 === segmented.length )
				) {
					output.pop();
					i += 2;
					continue;
				}
				// ./ segment
				else if (
					segmented[ i + 1 ] === '/' ||
					i + 1 === segmented.length
				) {
					i += 1;
					continue;
				}
			}
			// it is the start of a new segment
			while ( segmented[ i ] === '/' ) {
				i++;
			}
			segmentIndex = i;
		}
		// finish reading out the last segment
		if ( segmentIndex !== -1 ) {
			output.push( segmented.slice( segmentIndex ) );
		}
		return (
			parentUrl.slice( 0, parentUrl.length - pathname.length ) +
			output.join( '' )
		);
	}
}

function resolveUrl( relUrl, parentUrl ) {
	return (
		resolveIfNotPlainOrUrl( relUrl, parentUrl ) ||
		( isURL( relUrl )
			? relUrl
			: resolveIfNotPlainOrUrl( './' + relUrl, parentUrl ) )
	);
}

function getMatch( path, matchObj ) {
	if ( matchObj[ path ] ) {
		return path;
	}
	let sepIndex = path.length;
	do {
		const segment = path.slice( 0, sepIndex + 1 );
		if ( segment in matchObj ) {
			return segment;
		}
	} while ( ( sepIndex = path.lastIndexOf( '/', sepIndex - 1 ) ) !== -1 );
}

function applyPackages( id, packages ) {
	const pkgName = getMatch( id, packages );
	if ( pkgName ) {
		const pkg = packages[ pkgName ];
		if ( pkg === null ) {
			return;
		}
		return pkg + id.slice( pkgName.length );
	}
}

function resolveImportMap( importMap, resolvedOrPlain, parentUrl ) {
	let scopeUrl = parentUrl && getMatch( parentUrl, importMap.scopes );
	while ( scopeUrl ) {
		const packageResolution = applyPackages(
			resolvedOrPlain,
			importMap.scopes[ scopeUrl ]
		);
		if ( packageResolution ) {
			return packageResolution;
		}
		scopeUrl = getMatch(
			scopeUrl.slice( 0, scopeUrl.lastIndexOf( '/' ) ),
			importMap.scopes
		);
	}
	return (
		applyPackages( resolvedOrPlain, importMap.imports ) ||
		( resolvedOrPlain.indexOf( ':' ) !== -1 && resolvedOrPlain )
	);
}

function resolveAndComposePackages(
	packages,
	outPackages,
	baseUrl,
	parentMap
) {
	for ( const p in packages ) {
		const resolvedLhs = resolveIfNotPlainOrUrl( p, baseUrl ) || p;
		const target = packages[ p ];
		if ( typeof target !== 'string' ) {
			continue;
		}
		const mapped = resolveImportMap(
			parentMap,
			resolveIfNotPlainOrUrl( target, baseUrl ) || target,
			baseUrl
		);
		if ( mapped ) {
			outPackages[ resolvedLhs ] = mapped;
			continue;
		}
		// console.warn(
		// 	`Mapping "${ p }" -> "${ packages[ p ] }" does not resolve`
		// );
	}
}

function resolveAndComposeImportMap( json, baseUrl, parentMap ) {
	const outMap = {
		imports: Object.assign( {}, parentMap.imports ),
		scopes: Object.assign( {}, parentMap.scopes ),
	};

	if ( json.imports ) {
		resolveAndComposePackages(
			json.imports,
			outMap.imports,
			baseUrl,
			parentMap
		);
	}

	if ( json.scopes ) {
		for ( const s in json.scopes ) {
			const resolvedScope = resolveUrl( s, baseUrl );
			resolveAndComposePackages(
				json.scopes[ s ],
				outMap.scopes[ resolvedScope ] ||
					( outMap.scopes[ resolvedScope ] = {} ),
				baseUrl,
				parentMap
			);
		}
	}

	return outMap;
}

let importMap = { imports: {}, scopes: {} };

// TODO: check if this baseURI should change per document, and so
// it need to be passed as a parameter to methods like `resolve`.
const baseUrl = document.baseURI;
const pageBaseUrl = baseUrl;

/**
 * Extends the internal dynamic import map with the passed one.
 *
 * @param importMapIn         Import map.
 * @param importMapIn.imports Imports declaration.
 * @param importMapIn.scopes  Scopes declaration.
 */
export function addImportMap( importMapIn: {
	imports?: Record< string, string >;
	scopes?: Record< string, any >;
} ) {
	importMap = resolveAndComposeImportMap(
		importMapIn,
		pageBaseUrl,
		importMap
	);
}

/**
 * Resolves the URL of the passed module ID against the current internal
 * dynamic import map.
 *
 * @param id        Module ID.
 * @param parentUrl Parent URL, in case the module ID is relative.
 * @return Resolved module URL.
 */
export function resolve( id: string, parentUrl: string ): string {
	const urlResolved = resolveIfNotPlainOrUrl( id, parentUrl );
	return resolveImportMap( importMap, urlResolved || id, parentUrl ) || id;
}
