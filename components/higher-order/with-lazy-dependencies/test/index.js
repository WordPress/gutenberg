/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import withLazyDependencies from '../';

describe( 'withLazyDependencies', () => {
	function OriginalComponent() {
		return <p>&lt;3</p>;
	}

	it( 'should load dependencies', () => {
		const EnhancedComponent = withLazyDependencies( {
			scripts: [ 'tomato' ],
			styles: [ 'basil', 'mozzarella' ],
		} )( OriginalComponent );

		mount( <EnhancedComponent /> );

		const scriptUrl = document.querySelector( 'script' ).getAttribute( 'src' );
		expect( scriptUrl ).toBe( '/wp-admin/load-scripts.php?load=tomato' );

		const styleUrl = document.querySelector( 'link' ).getAttribute( 'href' );
		expect( styleUrl ).toBe( '/wp-admin/load-styles.php?load=basil,mozzarella' );
	} );

	it( 'should load dynamic dependencies', () => {
		const EnhancedComponent = withLazyDependencies( {
			scripts: () => [ 'tomato' ],
			styles: () => [ 'basil', 'mozzarella' ],
		} )( OriginalComponent );

		mount( <EnhancedComponent /> );

		const scriptUrl = document.querySelector( 'script' ).getAttribute( 'src' );
		expect( scriptUrl ).toBe( '/wp-admin/load-scripts.php?load=tomato' );

		const styleUrl = document.querySelector( 'link' ).getAttribute( 'href' );
		expect( styleUrl ).toBe( '/wp-admin/load-styles.php?load=basil,mozzarella' );
	} );

	it( 'should render wrapped component when dependencies are loaded', () => {
		const promise = Promise.resolve();
		const EnhancedComponent = withLazyDependencies( {
			scripts: () => [ 'tomato' ],
			loader: () => promise,
		} )( OriginalComponent );

		const wrapper = mount( <EnhancedComponent /> );
		return promise.then( () => {
			expect( wrapper.text() ).toBe( '<3' );
		} );
	} );

	it( 'should show loading component while loading', () => {
		const EnhancedComponent = withLazyDependencies( {
			scripts: () => [ 'tomato' ],
			loadingComponent: () => <p>Loading...</p>,
		} )( OriginalComponent );

		const wrapper = mount( <EnhancedComponent /> );
		expect( wrapper.text() ).toBe( 'Loading...' );
	} );

	it( 'should show error component when there is an error', () => {
		const promise = Promise.reject();
		const EnhancedComponent = withLazyDependencies( {
			scripts: () => [ 'tomato' ],
			loader: () => promise,
			errorComponent: () => <p>Error!</p>,
		} )( OriginalComponent );

		const wrapper = mount( <EnhancedComponent /> );
		return promise.catch( () => {
			expect( wrapper.text() ).toBe( 'Error!' );
		} );
	} );
} );
