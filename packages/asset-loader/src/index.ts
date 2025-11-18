type Style = {
	src: string;
	deps?: string[];
	version?: string;
	media?: string;
};
type InlineStyle = string | string[];
type Script = {
	src: string;
	deps?: string[];
	version?: string;
	in_footer?: boolean;
};
type InlineScript = string | string[];
type ScriptModules = Record< string, string >;

/**
 * Injects or extends the import map with new module entries.
 *
 * @param scriptModules - Object mapping module specifiers to URLs
 */
function injectImportMap( scriptModules: Record< string, string > ): void {
	if ( ! scriptModules || Object.keys( scriptModules ).length === 0 ) {
		return;
	}

	// Find the existing import map script element
	const existingMapElement = document.querySelector< HTMLScriptElement >(
		'script#wp-importmap[type=importmap]'
	);

	if ( existingMapElement ) {
		try {
			// Parse the existing import map
			const existingMap = JSON.parse( existingMapElement.text );

			// Ensure the imports object exists
			if ( ! existingMap.imports ) {
				existingMap.imports = {};
			}

			// Merge new imports with existing ones (new entries take precedence)
			existingMap.imports = {
				...existingMap.imports,
				...scriptModules,
			};

			// Update the script element's content
			existingMapElement.text = JSON.stringify( existingMap, null, 2 );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to parse or update import map:', error );
		}
	} else {
		// If no import map exists, create a new one
		const script = document.createElement( 'script' );
		script.type = 'importmap';
		script.id = 'wp-importmap';
		script.text = JSON.stringify(
			{
				imports: scriptModules,
			},
			null,
			2
		);
		document.head.appendChild( script );
	}
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
			const deps = assetsData[ handle ].deps || [];
			deps.forEach( ( dep ) => {
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
	const scriptElementsHead: HTMLScriptElement[] = [];
	const scriptElementsBody: HTMLScriptElement[] = [];

	for ( const handle of orderedScripts ) {
		const inFooter = scriptsData[ handle ].in_footer || false;
		const scriptElements = inFooter
			? scriptElementsBody
			: scriptElementsHead;

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

	const scriptsPromise = ( async () => {
		await performScriptLoad( scriptElementsHead, document.head );
		await performScriptLoad( scriptElementsBody, document.body );
	} )();

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
