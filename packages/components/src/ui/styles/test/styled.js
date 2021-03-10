/**
 * External dependencies
 */
import { css, styled } from '@wp-g2/styles';
import { render } from '@testing-library/react';

describe( 'basic', () => {
	test( 'should create a styled component', () => {
		const Component = styled.div`
			background: blue;
		`;

		const { container } = render( <Component /> );

		expect( container.firstChild ).toHaveStyle( { background: 'blue' } );
	} );

	test( 'should style an existing component', () => {
		const Previous = ( { className } ) => <div className={ className } />;

		const Component = styled( Previous )`
			background: blue;
		`;

		const { container } = render( <Component /> );

		expect( container.firstChild ).toHaveStyle( { background: 'blue' } );
	} );

	test( 'should style an existing styled component', () => {
		const Previous = styled.div`
			background: red;
		`;

		const Component = styled( Previous )`
			background: blue;
		`;

		const { container } = render( <Component /> );

		expect( container.firstChild ).toHaveStyle( { background: 'blue' } );
	} );
} );

describe( 'css', () => {
	test( 'should work with css function', () => {
		const style = css`
			color: red;
		`;

		const Component = styled.div`
			background: blue;
		`;

		const { container } = render( <Component className={ style } /> );

		expect( container.firstChild ).toHaveStyle( { background: 'blue' } );
		expect( container.firstChild ).toHaveStyle( { color: 'red' } );
	} );

	test( 'should render styles with css prop (string)', () => {
		const Component = styled.div`
			background: blue;
		`;

		const { container } = render(
			<Component
				css={ `
					color: red;
				` }
			/>
		);

		expect( container.firstChild ).toHaveStyle( { background: 'blue' } );
		expect( container.firstChild ).toHaveStyle( { color: 'red' } );
	} );

	test( 'should render styles with css prop (object)', () => {
		const Component = styled.div`
			background: blue;
		`;

		const { container } = render( <Component css={ { color: 'red' } } /> );

		expect( container.firstChild ).toHaveStyle( { background: 'blue' } );
		expect( container.firstChild ).toHaveStyle( { color: 'red' } );
	} );
} );

describe( 'as', () => {
	test( 'should support as render prop', () => {
		const Component = styled.div`
			background: blue;
		`;

		const { container } = render( <Component as="span" /> );

		expect( container.firstChild.tagName.toLowerCase() ).toBe( 'span' );
	} );
} );
