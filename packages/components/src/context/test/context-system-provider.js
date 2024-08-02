/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect } from '../context-connect';
import { ContextSystemProvider } from '../context-system-provider';
import { useContextSystem } from '../use-context-system';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

const View = styled.div``;

describe( 'props', () => {
	test( 'should render correctly', async () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );
		const container = createContainer();
		await render(
			<ContextSystemProvider>
				<ConnectedComponent />
			</ContextSystemProvider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should render context props', async () => {
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

		const container = createContainer();
		await render(
			<ContextSystemProvider value={ contextValue }>
				<ConnectedComponent />
			</ContextSystemProvider>,
			{ container }
		);

		expect( container ).toMatchSnapshot();
		expect( screen.getByText( 'Code is Poetry' ) ).toBeVisible();
	} );

	test( 'should render _override props', async () => {
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

		const container = createContainer();
		await render(
			<>
				<ContextSystemProvider value={ contextValue }>
					<ConnectedComponent
						className="test-component"
						quote="WordPress.org"
					/>
				</ContextSystemProvider>
			</>,
			{ container }
		);

		expect( container ).toMatchSnapshot();

		const element = screen.getByText( 'Code is Poetry' );
		expect( element ).toBeVisible();
		expect( element ).toHaveClass( 'test-component' );

		expect( screen.queryByText( 'WordPress.org' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'children', () => {
	test( 'should pass through children', async () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );

		await render(
			<ContextSystemProvider>
				<ConnectedComponent>Pass through</ConnectedComponent>
			</ContextSystemProvider>
		);

		expect( screen.getByText( 'Pass through' ) ).toBeInTheDocument();
	} );

	test( 'should not accept children via `context`', async () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );

		await render(
			<ContextSystemProvider
				context={ { Component: { children: 'Override' } } }
			>
				<ConnectedComponent />
			</ContextSystemProvider>
		);

		expect( screen.queryByText( 'Override' ) ).not.toBeInTheDocument();
	} );

	// This matches the behavior for normal, non-context-connected components.
	test( 'should not override inherent children', async () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref }>
				Inherent
			</View>
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );
		const NormalComponent = ( props ) => <div { ...props }>Inherent</div>;

		await render(
			<ContextSystemProvider>
				<ConnectedComponent />
				<ConnectedComponent>Explicit children</ConnectedComponent>
				<NormalComponent />
				<NormalComponent>Explicit children</NormalComponent>
			</ContextSystemProvider>
		);

		expect( screen.getAllByText( 'Inherent' ) ).toHaveLength( 4 );
	} );

	describe( 'when connected component does a `cloneElement()`', () => {
		// eslint-disable-next-line no-unused-vars
		const ComponentThatClones = ( { content, ...props }, _ref ) =>
			cloneElement(
				content,
				useContextSystem( props, 'ComponentThatClones' )
			);
		const ConnectedComponentThatClones = contextConnect(
			ComponentThatClones,
			'ComponentThatClones'
		);

		test( 'should not override cloned inherent children with implicit `undefined` children', async () => {
			await render(
				<ContextSystemProvider>
					<ConnectedComponentThatClones
						content={ <span>Inherent</span> }
					/>
				</ContextSystemProvider>
			);
			expect( screen.getByText( 'Inherent' ) ).toBeInTheDocument();
		} );

		test( 'should override cloned inherent children with explicit children', async () => {
			await render(
				<ContextSystemProvider>
					<ConnectedComponentThatClones
						content={ <span>Inherent</span> }
					>
						Explicit children
					</ConnectedComponentThatClones>
				</ContextSystemProvider>
			);
			expect(
				screen.getByText( 'Explicit children' )
			).toBeInTheDocument();
		} );
	} );
} );
