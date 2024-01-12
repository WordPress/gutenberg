/**
 * External dependencies
 */
import md5 from 'md5';

const workerProxies = {};

const pendingPromises = {};

export function registerWorker( handle, scriptUrl, callbacks ) {
	if ( workerProxies[ handle ] ) {
		window.console.error(
			`Worker with handle ${ handle } is already registered.`
		);
		return;
	}

	const worker = new Worker( scriptUrl, { type: 'module' } );

	workerProxies[ handle ] = {};
	callbacks.forEach( ( callback ) => {
		workerProxies[ handle ][ callback ] = createCallbackHandler(
			worker,
			callback
		);
	} );

	worker.onmessage = ( event ) => {
		if ( ! event.data || ! event.data.hash || ! event.data.result ) {
			return;
		}

		const { result, hash } = event.data;

		if ( ! pendingPromises[ hash ] ) {
			window.console.error(
				`Worker callback with hash ${ hash } does not exist or was already resolved.`
			);
			return;
		}

		const resolve = pendingPromises[ hash ];
		delete pendingPromises[ hash ];

		resolve( result );
	};

	return workerProxies[ handle ];
}

export function getWorker( handle ) {
	if ( ! workerProxies[ handle ] ) {
		window.console.error(
			`Worker with handle ${ handle } is not registered.`
		);
		return null;
	}

	return workerProxies[ handle ];
}

function createCallbackHandler( worker, callback ) {
	return ( ...args ) => {
		const hash = createPromiseHash( callback, args );

		const promise = new Promise( ( resolve ) => {
			pendingPromises[ hash ] = resolve;
		} );
		worker.postMessage( { callback, args, hash } );
		return promise;
	};
}

function createPromiseHash( callback, args ) {
	const initial = `${ callback }::${ md5( JSON.stringify( args ) ) }`;
	if ( ! pendingPromises[ initial ] ) {
		return initial;
	}

	let i = 2;
	while ( pendingPromises[ `${ initial }::${ i }` ] ) {
		i++;
	}

	return `${ initial }::${ i }`;
}
