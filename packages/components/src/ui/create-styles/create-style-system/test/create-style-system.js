/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { createStyleSystem } from '../index';

describe( 'createStyleSystem', () => {
	let compiler;

	const testCreateStyleSystem = ( ...args ) => {
		const styleSystem = createStyleSystem( ...args );
		compiler = styleSystem.compiler;
		return styleSystem;
	};

	afterAll( () => {
		if ( compiler?.flush ) {
			compiler.flush();
		}
	} );

	test( 'should include a styled element, View, and styled component that renders', () => {
		const { View, core, styled } = testCreateStyleSystem();

		const Box = styled.p`
			padding: 10px;
		`;
		const { container } = render(
			<>
				<core.input />
				<View as="span" />
				<Box />
			</>
		);

		expect( container.querySelector( 'input' ) ).toHaveStyle( {
			boxSizing: 'border-box',
		} );
		expect( container.querySelector( 'span' ) ).toHaveStyle( {
			boxSizing: 'border-box',
		} );
		expect( container.querySelector( 'p' ) ).toHaveStyle( {
			boxSizing: 'border-box',
			padding: '10px',
		} );
	} );

	test( 'should render custom baseStyles', () => {
		const { View } = testCreateStyleSystem( {
			baseStyles: {
				background: 'blue',
			},
		} );

		const { container } = render( <View /> );

		expect( container.querySelector( 'div' ) ).toHaveStyle( {
			boxSizing: 'border-box',
			background: 'blue',
		} );
	} );

	test( 'should support multiple nested style system instances', () => {
		const { View } = testCreateStyleSystem();
		const { View: AnotherView } = testCreateStyleSystem( {
			baseStyles: {
				padding: '2em',
			},
		} );

		const { container } = render(
			<View>
				<AnotherView as="span" />
			</View>
		);

		expect( container.querySelector( 'div' ) ).toHaveStyle( {
			boxSizing: 'border-box',
		} );
		expect( container.querySelector( 'span' ) ).toHaveStyle( {
			boxSizing: 'border-box',
			padding: '2em',
		} );
	} );
} );
