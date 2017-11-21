export function attachCallbacks( promises, itemCompletedCallback, allCompletedCallback ) {
	Promise.all( promises.map( ( promise, index ) =>
		promise
			.then( value => itemCompletedCallback( null, { index, value } ),
				error => itemCompletedCallback( { error, index }, null ) ) ) ).then( allCompletedCallback );
}

export const fromJqueryPromise = ( jqueryPromise ) => new Promise( ( resolve, reject ) => jqueryPromise.then( resolve, reject ) );
