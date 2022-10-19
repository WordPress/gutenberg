/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useBaseField } from '../index';
import { View } from '../../view';

const TestField = ( props ) => {
	return <View { ...useBaseField( props ) } />;
};

describe( 'base field', () => {
	it( 'should render correctly', () => {
		const base = render( <TestField /> ).container;
		expect( base.firstChild ).toMatchSnapshot();
	} );

	describe( 'props', () => {
		it( 'should render error styles', () => {
			const base = render( <TestField /> ).container;
			const { container } = render( <TestField hasError /> );
			expect( container.firstChild ).toMatchStyleDiffSnapshot(
				base.firstChild
			);
		} );

		it( 'should render inline styles', () => {
			const base = render( <TestField /> ).container;
			const { container } = render( <TestField isInline /> );
			expect( container.firstChild ).toMatchStyleDiffSnapshot(
				base.firstChild
			);
		} );

		it( 'should render subtle styles', () => {
			const base = render( <TestField /> ).container;
			const { container } = render( <TestField isSubtle /> );
			expect( container.firstChild ).toMatchStyleDiffSnapshot(
				base.firstChild
			);
		} );
	} );

	describe( 'useBaseField', () => {
		it( 'should pass through disabled and defaultValue props', () => {
			// wrap this in a component so that `useContext` calls don't fail inside the hook
			// assertions will still run as normal when we `render` the component :)
			const Component = () => {
				const disabled = Symbol.for( 'disabled' );
				const defaultValue = Symbol.for( 'defaultValue' );

				const result = useBaseField( { disabled, defaultValue } );

				expect( result.disabled ).toBe( disabled );
				expect( result.defaultValue ).toBe( defaultValue );

				return null;
			};

			render( <Component /> );
		} );
	} );
} );
