/**
 * External dependencies
 */
import { render } from 'enzyme';

/**
 * Internal dependencies
 */
import withPropsChange from '../';

describe( 'withPropsChange', () => {
	const InnerComponent = ( { myProp } ) => {
		return myProp ? ( <div>{ myProp }</div> ) : '';
	};
	it( 'should be able to add props', () => {
		const Component = withPropsChange(
			( props ) => ( { ...props, myProp: 'myPropValue' } )
		)( InnerComponent );
		expect( render( <InnerComponent /> ).text() ).toBe( '' );
		expect( render( <Component /> ).text() ).toBe( 'myPropValue' );
	} );

	it( 'should be able to remove props', () => {
		const Component = withPropsChange(
			( props ) => ( { ...props, myProp: undefined } )
		)( InnerComponent );
		expect( render( <InnerComponent myProp="myPropValue" /> ).text() ).toBe( 'myPropValue' );
		expect( render( <Component myProp="myPropValue" /> ).text() ).toBe( '' );
	} );

	it( 'should be able to change props', () => {
		const Component = withPropsChange(
			( props ) => ( { ...props, myProp: 'myPropValueChanged' } )
		)( InnerComponent );
		expect( render( <InnerComponent myProp="myPropValue" /> ).text() ).toBe( 'myPropValue' );
		expect( render( <Component myProp="myPropValue" /> ).text() ).toBe( 'myPropValueChanged' );
	} );

	it( 'should not change props if no mutation function is passed', () => {
		const Component = withPropsChange()( InnerComponent );
		expect( render( <InnerComponent myProp="myPropValue" /> ).text() ).toBe( 'myPropValue' );
		expect( render( <Component myProp="myPropValue" /> ).text() ).toBe( 'myPropValue' );
	} );
} );
