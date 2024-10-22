/**
 * The cache of prefetched stylesheets and scripts.
 */
export const headElements = new Map<
	string,
	{ tag: HTMLElement; text?: string }
>();

/**
 * Helper to update only the necessary tags in the head.
 *
 * @async
 * @param newHead The head elements of the new page.
 */
export const updateHead = async ( newHead: HTMLHeadElement[] ) => {
	// Helper to get the tag id store in the cache.
	const getTagId = ( tag: Element ) => tag.id || tag.outerHTML;

	// Map incoming head tags by their content.
	const newHeadMap = new Map< string, Element >();
	for ( const child of newHead ) {
		newHeadMap.set( getTagId( child ), child );
	}

	const toRemove: Element[] = [];

	// Detect nodes that should be added or removed.
	for ( const child of document.head.children ) {
		const id = getTagId( child );
		// Always remove styles and links as they might change.
		if ( child.nodeName === 'LINK' || child.nodeName === 'STYLE' ) {
			toRemove.push( child );
		} else if ( newHeadMap.has( id ) ) {
			newHeadMap.delete( id );
		} else if ( child.nodeName !== 'SCRIPT' && child.nodeName !== 'META' ) {
			toRemove.push( child );
		}
	}

	await Promise.all(
		[ ...headElements.entries() ]
			.filter( ( [ , { tag } ] ) => tag.nodeName === 'SCRIPT' )
			.map( async ( [ url ] ) => {
				await import( /* webpackIgnore: true */ url );
			} )
	);

	// Prepare new assets.
	const toAppend = [ ...newHeadMap.values() ];

	// Apply the changes.
	toRemove.forEach( ( n ) => n.remove() );
	document.head.append( ...toAppend );
};

/**
 * Fetches and processes head assets (stylesheets and scripts) from a specified document.
 *
 * @async
 * @param doc The document from which to fetch head assets. It should support standard DOM querying methods.
 *
 * @return Returns an array of HTML elements representing the head assets.
 */
export const fetchHeadAssets = async (
	doc: Document
): Promise< HTMLElement[] > => {
	const headTags = [];

	// We only want to fetch module scripts because regular scripts (without
	// `async` or `defer` attributes) can depend on the execution of other scripts.
	// Scripts found in the head are blocking and must be executed in order.
	const scripts = doc.querySelectorAll< HTMLScriptElement >(
		'script[type="module"][src]'
	);

	scripts.forEach( ( script ) => {
		const src = script.getAttribute( 'src' );
		if ( ! headElements.has( src ) ) {
			// add the <link> elements to prefetch the module scripts
			const link = doc.createElement( 'link' );
			link.rel = 'modulepreload';
			link.href = src;
			document.head.append( link );
			headElements.set( src, { tag: script } );
		}
	} );

	const stylesheets = doc.querySelectorAll< HTMLLinkElement >(
		'link[rel=stylesheet]'
	);

	await Promise.all(
		Array.from( stylesheets ).map( async ( tag ) => {
			const href = tag.getAttribute( 'href' );
			if ( ! href ) {
				return;
			}

			if ( ! headElements.has( href ) ) {
				try {
					const response = await fetch( href );
					const text = await response.text();
					headElements.set( href, {
						tag,
						text,
					} );
				} catch ( e ) {
					// eslint-disable-next-line no-console
					console.error( e );
				}
			}

			const headElement = headElements.get( href );
			const styleElement = doc.createElement( 'style' );
			styleElement.textContent = headElement.text;

			headTags.push( styleElement );
		} )
	);

	return [
		doc.querySelector( 'title' ),
		...doc.querySelectorAll( 'style' ),
		...headTags,
	];
};
