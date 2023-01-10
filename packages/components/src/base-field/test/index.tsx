/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useBaseField } from '../index';
import { View } from '../../view';
import type { BaseFieldProps } from '../types';

const TestField = ( props: Omit< BaseFieldProps, 'children' > ) => {
	return <View { ...useBaseField( { ...props, children: '' } ) } />;
};

describe( 'base field', () => {
	it( 'should render correctly', () => {
		const { container } = render( <TestField /> );
		expect( container ).toMatchSnapshot();
	} );

	describe( 'props', () => {
		it( 'should render error styles', () => {
			render(
				<>
					<TestField data-testid="base-field" />
					<TestField hasError data-testid="base-field-error" />
				</>
			);
			expect(
				screen.getByTestId( 'base-field-error' )
			).toMatchStyleDiffSnapshot( screen.getByTestId( 'base-field' ) );
		} );

		it( 'should render inline styles', () => {
			render(
				<>
					<TestField data-testid="base-field" />
					<TestField isInline data-testid="base-field-inline" />
				</>
			);
			expect(
				screen.getByTestId( 'base-field-inline' )
			).toMatchStyleDiffSnapshot( screen.getByTestId( 'base-field' ) );
		} );

		it( 'should render subtle styles', () => {
			render(
				<>
					<TestField data-testid="base-field" />
					<TestField isSubtle data-testid="base-field-subtle" />
				</>
			);
			expect(
				screen.getByTestId( 'base-field-subtle' )
			).toMatchStyleDiffSnapshot( screen.getByTestId( 'base-field' ) );
		} );
	} );

	describe( 'useBaseField', () => {
		it( 'should pass through disabled and defaultValue props', () => {
			// wrap this in a component so that `useContext` calls don't fail inside the hook
			// assertions will still run as normal when we `render` the component :)
			const Component = () => {
				const disabled = true;
				const defaultValue = 'Lorem ipsum';

				const result = useBaseField( {
					disabled,
					defaultValue,
					children: '',
				} );

				expect( result.disabled ).toBe( disabled );
				expect( result.defaultValue ).toBe( defaultValue );

				return null;
			};

			render( <Component /> );
		} );
	} );
} );
