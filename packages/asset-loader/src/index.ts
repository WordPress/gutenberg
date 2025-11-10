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
	inlineStyles: Record< 'before' | 'after', Record< string, InlineStyle > >
): Promise< void > {
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
}

export default loadAssets;
