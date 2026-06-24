type Style = {
	src: string;
	deps?: string[] | Record< string, string >;
	version?: string;
	media?: string;
};
type InlineStyle = string | string[];
type Script = {
	src: string;
	deps?: string[] | Record< string, string >;
	version?: string;
	in_footer?: boolean;
};
type InlineScript = string | string[];
type ScriptModules = Record< string, string >;

let importMapIndex = 0;

function getImportMapImports(): Record< string, string > {
	const imports: Record< string, string > = {};
	const importMapElements = document.querySelectorAll< HTMLScriptElement >(
		'script[type=importmap]'
	);

	for ( const importMapElement of importMapElements ) {
		try {
			Object.assign(
				imports,
				JSON.parse( importMapElement.text ).imports || {}
			);
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to parse import map:', error );
		}
	}

	return imports;
}

/**
 * Injects or extends the import map with new module entries.
 *
 * @param scriptModules - Object mapping module specifiers to URLs
 */
function injectImportMap( scriptModules: Record< string, string > ): void {
	if ( ! scriptModules || Object.keys( scriptModules ).length === 0 ) {
		return;
	}

	const existingImports = getImportMapImports();
	const newImports = Object.fromEntries(
		Object.entries( scriptModules ).filter(
			( [ id ] ) => ! existingImports[ id ]
		)
	);

	if ( Object.keys( newImports ).length === 0 ) {
		return;
	}

	const script = document.createElement( 'script' );
	script.type = 'importmap';
	script.id = document.getElementById( 'wp-importmap' )
		? `wp-importmap-lazy-${ ++importMapIndex }`
		: 'wp-importmap';
	script.text = JSON.stringify(
		{
			imports: newImports,
		},
		null,
		2
	);
	document.head.appendChild( script );
}

function getDependencies( deps?: string[] | Record< string, string > ) {
	if ( Array.isArray( deps ) ) {
		return deps;
	}

	return Object.values( deps ?? {} );
}

function loadStylesheet( handle: string, styleData: Style ): Promise< void > {
	return new Promise( ( resolve ) => {
		if ( ! styleData.src ) {
			resolve(); // No external file to load
			return;
		}

		const existingLink = document.getElementById( handle + '-css' );
		if ( existingLink ) {
			resolve(); // Already loaded
			return;
		}

		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href =
			styleData.src +
			( styleData.version ? '?ver=' + styleData.version : '' );
		link.id = handle + '-css';
		link.media = styleData.media || 'all';

		link.onload = () => resolve();
		link.onerror = () => {
			// eslint-disable-next-line no-console
			console.error( `Failed to load stylesheet: ${ handle }` );
			resolve();
		};

		document.head.appendChild( link );
	} );
}

function loadScript( handle: string, scriptData: Script ): HTMLScriptElement {
	// If no external script source, just mark as processed and resolve
	if ( ! scriptData.src ) {
		// Still mark as processed with an ID so we don't repeat processing
		const marker = document.createElement( 'script' );
		marker.id = handle + '-js';
		marker.textContent = '// Processed: ' + handle;
		return marker;
	}

	const script = document.createElement( 'script' );
	script.src =
		scriptData.src +
		( scriptData.version ? '?ver=' + scriptData.version : '' );
	script.id = handle + '-js';
	script.async = false;

	return script;
}

// Function to inject inline styles
function injectInlineStyle(
	handle: string,
	inlineStyle: InlineStyle,
	position: 'before' | 'after'
) {
	// Handle both string and array formats
	let styleContent = '';
	if ( Array.isArray( inlineStyle ) ) {
		styleContent = inlineStyle.join( '\n' );
	} else if ( typeof inlineStyle === 'string' ) {
		styleContent = inlineStyle;
	}

	if ( styleContent && styleContent.trim() ) {
		const styleId = handle + '-' + position + '-inline-css';
		if ( ! document.getElementById( styleId ) ) {
			const style = document.createElement( 'style' );
			style.id = styleId;
			style.textContent = styleContent.trim();
			document.head.appendChild( style );
		}
	}
}

function injectInlineScript(
	handle: string,
	inlineScript: InlineScript,
	position: 'before' | 'after'
): HTMLScriptElement {
	let scriptContent = inlineScript;
	if ( Array.isArray( scriptContent ) ) {
		scriptContent = scriptContent.join( '\n' );
	}

	const script = document.createElement( 'script' );
	script.id = handle + '-' + position + '-js';
	script.textContent = scriptContent.trim();

	return script;
}

function getVersionedSrc( src: string, version?: string ) {
	if ( ! version ) {
		return src;
	}

	return src + '?ver=' + version;
}

function getInlineContent( inlineAsset?: InlineStyle | InlineScript ) {
	if ( Array.isArray( inlineAsset ) ) {
		return inlineAsset.join( '\n' );
	}

	return inlineAsset ?? '';
}

function getStyleHtml(
	handle: string,
	styleData: Style,
	inlineStyles: Record< 'before' | 'after', Record< string, InlineStyle > >
) {
	const beforeInline = getInlineContent( inlineStyles.before?.[ handle ] );
	const afterInline = getInlineContent( inlineStyles.after?.[ handle ] );

	return [
		beforeInline
			? `<style id="${ handle }-before-inline-css">${ beforeInline }</style>`
			: '',
		styleData.src
			? `<link rel="stylesheet" href="${ getVersionedSrc(
					styleData.src,
					styleData.version
			  ) }" id="${ handle }-css" media="${ styleData.media || 'all' }">`
			: '',
		afterInline
			? `<style id="${ handle }-after-inline-css">${ afterInline }</style>`
			: '',
	]
		.filter( Boolean )
		.join( '\n' );
}

function getScriptHtml(
	handle: string,
	scriptData: Script,
	inlineScripts: Record< 'before' | 'after', Record< string, InlineScript > >
) {
	const beforeInline = getInlineContent( inlineScripts.before?.[ handle ] );
	const afterInline = getInlineContent( inlineScripts.after?.[ handle ] );

	return [
		beforeInline
			? `<script id="${ handle }-before-js">${ beforeInline }</script>`
			: '',
		scriptData.src
			? `<script src="${ getVersionedSrc(
					scriptData.src,
					scriptData.version
			  ) }" id="${ handle }-js"></script>`
			: `<script id="${ handle }-js"></script>`,
		afterInline
			? `<script id="${ handle }-after-js">${ afterInline }</script>`
			: '',
	]
		.filter( Boolean )
		.join( '\n' );
}

export function getResolvedAssetsHtml(
	scriptsData: Record< string, Script >,
	inlineScripts: Record< 'before' | 'after', Record< string, InlineScript > >,
	stylesData: Record< string, Style >,
	inlineStyles: Record< 'before' | 'after', Record< string, InlineStyle > >
) {
	const orderedStyles = buildDependencyOrderedList( stylesData );
	const orderedScripts = buildDependencyOrderedList( scriptsData );

	return {
		styles: orderedStyles
			.map( ( handle ) =>
				getStyleHtml( handle, stylesData[ handle ], inlineStyles )
			)
			.join( '\n' ),
		scripts: orderedScripts
			.map( ( handle ) =>
				getScriptHtml( handle, scriptsData[ handle ], inlineScripts )
			)
			.join( '\n' ),
	};
}

// Function to create dependency-ordered list respecting WordPress dependency graph
function buildDependencyOrderedList< T extends Style | Script >(
	assetsData: Record< string, T >
) {
	const visited = new Set();
	const visiting = new Set();
	const orderedList: string[] = [];

	function visit( handle: string ) {
		if ( visited.has( handle ) ) {
			return;
		}
		if ( visiting.has( handle ) ) {
			// Circular dependency detected, skip to avoid infinite loop
			// eslint-disable-next-line no-console
			console.warn(
				`Circular dependency detected for handle: ${ handle }`
			);
			return;
		}

		visiting.add( handle );

		if ( assetsData[ handle ] ) {
			// Visit all dependencies first
			getDependencies( assetsData[ handle ].deps ).forEach( ( dep ) => {
				if ( assetsData[ dep ] ) {
					visit( dep );
				}
			} );
		}

		visiting.delete( handle );
		visited.add( handle );

		if ( assetsData[ handle ] ) {
			orderedList.push( handle );
		}
	}

	// Visit all handles
	Object.keys( assetsData ).forEach( ( handle ) => {
		visit( handle );
	} );

	return orderedList;
}

async function performScriptLoad(
	scriptElements: HTMLScriptElement[],
	destination: HTMLElement
) {
	let parallel = [];
	for ( const scriptElement of scriptElements ) {
		if ( scriptElement.src ) {
			// External scripts can be loaded in parallel. They will be executed in DOM order
			// because the `script` tags have an `async = false` attribute. Therefore cross-script
			// dependencies are guaranteed to be satisfied.
			const loader = Promise.withResolvers< void >();
			scriptElement.onload = () => loader.resolve();
			scriptElement.onerror = () => {
				// eslint-disable-next-line no-console
				console.error( `Failed to load script: ${ scriptElement.id }` );
				loader.resolve();
			};
			parallel.push( loader.promise );
		} else {
			// We've encountered an inline script. Inline scripts are executed immediately after
			// inserting them to the DOM. Therefore we need to wait for all external scripts to load.
			await Promise.all( parallel );
			parallel = [];
		}
		// Append the `script` element (external or inline) to the DOM and trigger the load.
		destination.appendChild( scriptElement );
	}
	// Wait for all the remainingexternal scripts to load.
	await Promise.all( parallel );
	parallel = [];
}

// Main async function to load all assets and return editor settings
async function loadAssets(
	scriptsData: Record< string, Script >,
	inlineScripts: Record< 'before' | 'after', Record< string, InlineScript > >,
	stylesData: Record< string, Style >,
	inlineStyles: Record< 'before' | 'after', Record< string, InlineStyle > >,
	htmlTemplates?: string[],
	scriptModules?: ScriptModules
): Promise< void > {
	// Inject import map first so script modules can be resolved
	if ( scriptModules ) {
		injectImportMap( scriptModules );
	}

	// Build dependency-ordered lists
	const orderedStyles = buildDependencyOrderedList( stylesData );
	const orderedScripts = buildDependencyOrderedList( scriptsData );

	const stylePromises: Promise< void >[] = [];

	// Load stylesheets in dependency order
	for ( const handle of orderedStyles ) {
		const beforeInline = inlineStyles.before?.[ handle ];
		if ( beforeInline ) {
			injectInlineStyle( handle, beforeInline, 'before' );
		}
		stylePromises.push( loadStylesheet( handle, stylesData[ handle ] ) );
		const afterInline = inlineStyles.after?.[ handle ];
		if ( afterInline ) {
			injectInlineStyle( handle, afterInline, 'after' );
		}
	}

	// Load scripts in dependency order
	const scriptElements: HTMLScriptElement[] = [];

	for ( const handle of orderedScripts ) {
		const beforeInline = inlineScripts.before?.[ handle ];
		if ( beforeInline ) {
			scriptElements.push(
				injectInlineScript( handle, beforeInline, 'before' )
			);
		}

		scriptElements.push( loadScript( handle, scriptsData[ handle ] ) );

		const afterInline = inlineScripts.after?.[ handle ];
		if ( afterInline ) {
			scriptElements.push(
				injectInlineScript( handle, afterInline, 'after' )
			);
		}
	}

	const scriptsPromise = performScriptLoad( scriptElements, document.body );

	await Promise.all( [ Promise.all( stylePromises ), scriptsPromise ] );

	// Inject HTML templates (e.g., wp.media templates) into the DOM
	// Note: We can't use innerHTML for script tags, so we need to parse and create elements properly
	if ( htmlTemplates && htmlTemplates.length > 0 ) {
		htmlTemplates.forEach( ( templateHtml ) => {
			// Extract the script tag attributes and content
			const scriptMatch = templateHtml.match(
				/<script([^>]*)>(.*?)<\/script>/is
			);
			if ( scriptMatch ) {
				const attributes = scriptMatch[ 1 ];
				const content = scriptMatch[ 2 ];

				// Create a new script element
				const script = document.createElement( 'script' );

				// Extract and set the id attribute
				const idMatch = attributes.match( /id=["']([^"']+)["']/ );
				if ( idMatch ) {
					script.id = idMatch[ 1 ];
				}

				// Extract and set the type attribute
				const typeMatch = attributes.match( /type=["']([^"']+)["']/ );
				if ( typeMatch ) {
					script.type = typeMatch[ 1 ];
				}

				// Set the content
				script.textContent = content;

				// Append to body
				document.body.appendChild( script );
			}
		} );
	}
}

export default loadAssets;
