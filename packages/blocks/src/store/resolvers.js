function loaderElement( type, src ) {
	if ( type === 'script' ) {
		const script = document.createElement( 'script' );
		script.src = src;
		return script;
	}

	if ( type === 'style' ) {
		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = src;
		return link;
	}

	return null;
}

export const getBlockType = ( name ) => async () => {
	const mods = window.wp.importmap[ name ];
	if ( ! mods ) {
		return;
	}

	await Promise.all(
		mods
			.filter( ( mod ) => mod.src )
			.map(
				( mod ) =>
					new Promise( ( resolve, reject ) => {
						const node = loaderElement( mod.type, mod.src );
						node.onload = () => {
							resolve();
						};
						node.onerror = () => {
							reject(
								new Error(
									`Failed to load ${ mod.type } ${ name } ${ mod.handle } ${ mod.src }`
								)
							);
						};
						document.body.appendChild( node );
					} )
			)
	);
};
