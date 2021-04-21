/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { contextConnect } from '../context-connect';
import { ContextSystemProvider } from '../context-system-provider';
import { useContextSystem } from '../use-context-system';

const View = styled.div``;

describe( 'props', () => {
	test( 'should render correctly', () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );
		const { container } = render(
			<ContextSystemProvider>
				<ConnectedComponent />
			</ContextSystemProvider>
		);

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render context props', () => {
		const Component = ( props, ref ) => {
			const { quote, ...otherProps } = useContextSystem(
				props,
				'Component'
			);
			return (
				<View { ...otherProps } ref={ ref }>
					{ quote }
				</View>
			);
		};

		const ConnectedComponent = contextConnect( Component, 'Component' );

		const contextValue = {
			Component: {
				quote: 'Code is Poetry',
			},
		};

		const { container } = render(
			<ContextSystemProvider value={ contextValue }>
				<ConnectedComponent />
			</ContextSystemProvider>
		);

		expect( container.firstChild ).toMatchSnapshot();
		expect( container.firstChild.innerHTML ).toContain( 'Code is Poetry' );
	} );

	test( 'should render _override props', () => {
		const Component = ( props, ref ) => {
			const { quote, ...otherProps } = useContextSystem(
				props,
				'Component'
			);
			return (
				<View { ...otherProps } ref={ ref }>
					{ quote }
				</View>
			);
		};

		const ConnectedComponent = contextConnect( Component, 'Component' );

		const contextValue = {
			Component: {
				_overrides: {
					quote: 'Code is Poetry',
				},
			},
		};

		const { container } = render(
			<>
				<ContextSystemProvider value={ contextValue }>
					<ConnectedComponent
						className="test-component"
						quote="WordPress.org"
					/>
				</ContextSystemProvider>
			</>
		);

		expect( container.firstChild ).toMatchSnapshot();

		const el = container.querySelector( '.test-component' );

		expect( el.innerHTML ).toContain( 'Code is Poetry' );
		expect( el.innerHTML ).not.toContain( 'WordPress.org' );
	} );
} );
