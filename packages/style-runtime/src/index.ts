type GlobalScopeWithStyleRuntime = typeof globalThis & {
	__wpStyleRuntime?: {
		documents: Map< Document, number >;
		styles: Map< string, string >;
	};
};

const STYLE_HASH_ATTRIBUTE = 'data-wp-hash';

function getRuntime() {
	const globalScope = globalThis as GlobalScopeWithStyleRuntime;

	if ( globalScope.__wpStyleRuntime ) {
		return globalScope.__wpStyleRuntime;
	}

	globalScope.__wpStyleRuntime = {
		documents: new Map(),
		styles: new Map(),
	};

	if ( typeof document !== 'undefined' ) {
		registerDocument( document );
	}

	return globalScope.__wpStyleRuntime;
}

function injectStyle( targetDocument: Document, hash: string, css: string ) {
	if (
		! targetDocument.head ||
		targetDocument.head.querySelector(
			`style[${ STYLE_HASH_ATTRIBUTE }="${ hash }"]`
		)
	) {
		return;
	}

	const style = targetDocument.createElement( 'style' );
	style.setAttribute( STYLE_HASH_ATTRIBUTE, hash );
	style.appendChild( targetDocument.createTextNode( css ) );
	targetDocument.head.appendChild( style );
}

export function registerDocument( targetDocument: Document ) {
	const runtime = getRuntime();

	runtime.documents.set(
		targetDocument,
		( runtime.documents.get( targetDocument ) ?? 0 ) + 1
	);

	for ( const [ hash, css ] of runtime.styles ) {
		injectStyle( targetDocument, hash, css );
	}

	return () => {
		const count = runtime.documents.get( targetDocument );

		if ( count === undefined ) {
			return;
		}

		if ( count <= 1 ) {
			runtime.documents.delete( targetDocument );
			return;
		}

		runtime.documents.set( targetDocument, count - 1 );
	};
}

export function registerStyle( hash: string, css: string ) {
	const runtime = getRuntime();

	runtime.styles.set( hash, css );

	for ( const targetDocument of runtime.documents.keys() ) {
		injectStyle( targetDocument, hash, css );
	}
}
