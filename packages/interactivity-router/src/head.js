/**
 * Helper to update only the necessary tags in the head.
 *
 * @async
 * @param {Array} newHead The head elements of the new page.
 */
export const updateHead = async ( newHead ) => {
	// Helper to get the tag id store in the cache.
	const getTagId = ( tag ) => tag.id || tag.outerHTML;

	// Map incoming head tags by their content.
	const newHeadMap = new Map();
	for ( const child of newHead ) {
		newHeadMap.set( getTagId( child ), child );
	}

	const toRemove = [];

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
 * @param {Document} doc          The document from which to fetch head assets. It should support standard DOM querying methods.
 * @param {Map}      headElements A map of head elements to modify tracking the URLs of already processed assets to avoid duplicates.
 *
 * @return {Promise<HTMLElement[]>} Returns an array of HTML elements representing the head assets.
 */
export const fetchHeadAssets = async ( doc, headElements ) => {
	const headTags = [];
	const assets = [
		{
			tagName: 'style',
			selector: 'link[rel=stylesheet]',
			attribute: 'href',
		},
		{ tagName: 'script', selector: 'script[src]', attribute: 'src' },
	];
	for ( const asset of assets ) {
		const { tagName, selector, attribute } = asset;
		const tags = doc.querySelectorAll( selector );

		// Use Promise.all to wait for fetch to complete
		await Promise.all(
			Array.from( tags ).map( async ( tag ) => {
				const attributeValue = tag.getAttribute( attribute );
				if ( ! headElements.has( attributeValue ) ) {
					try {
						const response = await fetch( attributeValue );
						const text = await response.text();
						headElements.set( attributeValue, {
							tag,
							text,
						} );
					} catch ( e ) {
						// eslint-disable-next-line no-console
						console.error( e );
					}
				}

				const headElement = headElements.get( attributeValue );
				const element = doc.createElement( tagName );
				element.innerText = headElement.text;
				for ( const attr of headElement.tag.attributes ) {
					element.setAttribute( attr.name, attr.value );
				}
				headTags.push( element );
			} )
		);
	}

	return [
		doc.querySelector( 'title' ),
		...doc.querySelectorAll( 'style' ),
		...headTags,
	];
};
