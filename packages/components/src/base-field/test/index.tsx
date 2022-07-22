/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useBaseField } from '../index';
import { View } from '../../view';
import type { WordPressComponentProps } from '../../ui/context';
import type { UseBaseFieldProps } from '../types';

const TestField = (
	props: WordPressComponentProps< UseBaseFieldProps, 'div' >
) => {
	return <View { ...useBaseField( props ) } />;
};

describe( 'base field', () => {
	let base: HTMLElement;

	beforeEach( () => {
		base = render( <TestField /> ).container;
	} );

	it( 'should render correctly', () => {
		expect( base.firstChild ).toMatchSnapshot();
	} );

	describe( 'props', () => {
		it( 'should render error styles', () => {
			const { container } = render( <TestField hasError /> );
			expect( container.firstChild ).toMatchStyleDiffSnapshot(
				base.firstElementChild
			);
		} );

		it( 'should render inline styles', () => {
			const { container } = render( <TestField isInline /> );
			expect( container.firstChild ).toMatchStyleDiffSnapshot(
				base.firstElementChild
			);
		} );

		it( 'should render subtle styles', () => {
			const { container } = render( <TestField isSubtle /> );
			expect( container.firstChild ).toMatchStyleDiffSnapshot(
				base.firstElementChild
			);
		} );
	} );

	describe( 'useBaseField', () => {
		it( 'should pass through disabled and defaultValue props', () => {
			// wrap this in a component so that `useContext` calls don't fail inside the hook
			// assertions will still run as normal when we `render` the component :)
			const Component = () => {
				let disabled = true;
				let defaultValue = 'test';

				let result = useBaseField( { disabled, defaultValue } );

				expect( result.disabled ).toBe( disabled );
				expect( result.defaultValue ).toBe( defaultValue );

				disabled = false;
				defaultValue = 'something-else';

				result = useBaseField( { disabled, defaultValue } );

				expect( result.disabled ).toBe( disabled );
				expect( result.defaultValue ).toBe( defaultValue );

				return null;
			};

			render( <Component /> );
		} );
	} );
} );
