const getTagId = ( tag ) => tag.id || tag.outerHTML;

const canBePreloaded = ( e ) => e.src || ( e.href && e.rel !== 'preload' );

const loadAsset = ( a ) => {
	const loader = document.createElement( 'link' );
	loader.rel = 'preload';
	if ( a.nodeName === 'SCRIPT' ) {
		loader.as = 'script';
		loader.href = a.getAttribute( 'src' );
	} else if ( a.nodeName === 'LINK' ) {
		loader.as = 'style';
		loader.href = a.getAttribute( 'href' );
	}

	const p = new Promise( ( resolve, reject ) => {
		loader.onload = () => resolve( loader );
		loader.onerror = () => reject( loader );
	} );

	document.head.appendChild( loader );
	return p;
};

const activateScript = ( n ) => {
	if ( n.nodeName !== 'SCRIPT' ) return n;
	const s = document.createElement( n.nodeName );
	s.innerText = n.innerText;
	for ( const attr of n.attributes ) {
		s.setAttribute( attr.name, attr.value );
	}
	return s;
};

export const updateHead = async ( newHead ) => {
	// Map incoming head tags by their content.
	const newHeadMap = new Map();
	for ( const child of newHead.children ) {
		newHeadMap.set( getTagId( child ), child );
	}

	const toRemove = [];

	// Detect nodes that should be added or removed.
	for ( const child of document.head.children ) {
		const id = getTagId( child );
		if ( newHeadMap.has( id ) ) newHeadMap.delete( id );
		else if ( child.nodeName !== 'SCRIPT' ) toRemove.push( child );
	}

	// Prepare new assets.
	const toAppend = [ ...newHeadMap.values() ];

	// Wait for all new assets to be loaded.
	const loaders = await Promise.all(
		toAppend.filter( canBePreloaded ).map( loadAsset )
	);

	// Apply the changes.
	toRemove.forEach( ( n ) => n.remove() );
	loaders.forEach( ( l ) => l && l.remove() );
	document.head.append( ...toAppend.map( activateScript ) );
};
