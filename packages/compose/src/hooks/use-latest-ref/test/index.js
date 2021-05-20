/**
 * External dependencies
 */
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import useLatestRef from '../';

describe( 'useLatestRef', () => {
	let refCallbackValue;

	function ComponentWithRefCallback( { value } ) {
		const lastestRef = useLatestRef( value );

		function refCallback() {
			refCallbackValue = lastestRef.current;
		}

		return <div ref={ refCallback } />;
	}

	beforeEach( () => {
		const rootElement = document.createElement( 'div' );
		rootElement.id = 'root';
		document.body.appendChild( rootElement );
	} );

	afterEach( () => {
		refCallbackValue = undefined;
		document.body.innerHTML = '';
	} );

	it( 'should be up-to-date for ref callbacks', () => {
		const rootElement = document.getElementById( 'root' );

		ReactDOM.render( <ComponentWithRefCallback value="1" />, rootElement );

		// Should be correct after mount.
		expect( refCallbackValue ).toEqual( '1' );

		ReactDOM.render( <ComponentWithRefCallback value="2" />, rootElement );

		// Should be correct after a re-render.
		expect( refCallbackValue ).toEqual( '2' );
	} );
} );
