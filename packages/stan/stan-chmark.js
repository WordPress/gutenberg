/**
 * WordPress dependencies
 */
const {
	createAtom,
	createAtomSelector,
	createAtomRegistry,
} = require( '@wordpress/stan' );

const items = {};
for ( let i = 0; i < 100000; i++ ) {
	const digit = ( n ) => ( e ) => Math.floor( ( n % ( e * 10 ) ) / e );
	items[ i ] = {
		title: [ 10000, 1000, 100, 10, 1 ].map( digit( i ) ).join( '' ),
	};
}

const getItemProp = ( id, prop ) => items[ id ][ prop ];

const itemsA = createAtom( items );

const itemS = createAtomSelector( ( id ) => ( { get } ) =>
	get( itemsA )[ id ]
);
const itemPropS = createAtomSelector( ( id, prop ) => ( { get } ) =>
	get( itemS( id ) )[ prop ]
);

const timed = ( fun, label ) => {
	console.time( label );
	fun();
	console.timeEnd( label );
};

function runStanChmark() {
	const registry = createAtomRegistry();

	function benchRedux() {
		for ( let i = 0; i < 100000; i++ ) {
			getItemProp( i, 'title' );
		}
	}

	function benchStan() {
		for ( let i = 0; i < 100000; i++ ) {
			registry.get( itemPropS( i, 'title' ) );
		}
	}

	timed( benchRedux, 'redux1' );
	timed( benchRedux, 'redux2' );
	timed( benchStan, 'stan1' );
	timed( benchStan, 'stan2' );
}

runStanChmark();
