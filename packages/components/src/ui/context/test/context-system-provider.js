/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
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

	test( 'should not override children via context system', () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );

		render(
			<ContextSystemProvider
				context={ { Component: { children: 'Override' } } }
			>
				<ConnectedComponent />
			</ContextSystemProvider>
		);

		expect( screen.queryByText( 'Override' ) ).not.toBeInTheDocument();
	} );

	// This matches the behavior for normal, non-context-connected components.
	test( 'should not override inherent children', () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref }>
				Inherent
			</View>
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );

		render(
			<ContextSystemProvider>
				<ConnectedComponent />
				<ConnectedComponent>Explicit children</ConnectedComponent>
			</ContextSystemProvider>
		);

		expect( screen.getAllByText( 'Inherent' ) ).toHaveLength( 2 );
	} );
} );

describe( 'Context System with polymorphic components', () => {
	test( 'should pass through children to the `as` component', () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );

		render(
			<ContextSystemProvider>
				<ConnectedComponent as="span">Pass through</ConnectedComponent>
			</ContextSystemProvider>
		);

		expect( screen.getByText( 'Pass through' ) ).toBeInTheDocument();
	} );

	test( 'should not override inherent children', () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );
		const AnotherComponent = ( props ) => (
			<span { ...props }>Inherent</span>
		);

		render(
			<ContextSystemProvider>
				<ConnectedComponent as={ AnotherComponent } />
				<ConnectedComponent as={ AnotherComponent }>
					Explicit children
				</ConnectedComponent>
			</ContextSystemProvider>
		);

		expect( screen.getAllByText( 'Inherent' ) ).toHaveLength( 2 );
	} );

	describe( 'should handle implicit `undefined` children when an `as` component does a `cloneElement()`', () => {
		const Component = ( props, ref ) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref } />
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );

		const ComponentThatClones = ( { content, ...props } ) =>
			cloneElement( content, props );
		const ComponentThatClonesWithoutChildren = ( {
			content,
			children,
			...props
		} ) => cloneElement( content, props );

		const ElementToClone = <span>Inherent</span>;

		test.each( [
			[
				'should not override cloned inherent children with implicit `undefined` children',
				() => (
					<ConnectedComponent
						as={ ComponentThatClones }
						content={ ElementToClone }
					/>
				),
				'Inherent',
			],
			[
				'should override cloned inherent children with explicit children',
				() => (
					<ConnectedComponent
						as={ ComponentThatClones }
						content={ ElementToClone }
					>
						Override
					</ConnectedComponent>
				),
				'Override',
			],
			[
				'should not override cloned inherent children with explicit children if cloning code omitted the children',
				() => (
					<ConnectedComponent
						as={ ComponentThatClonesWithoutChildren }
						content={ ElementToClone }
					>
						Override
					</ConnectedComponent>
				),
				'Inherent',
			],
		] )( '%s', ( _description, ComponentToTest, expectedText ) => {
			render(
				<ContextSystemProvider>
					<ComponentToTest />
				</ContextSystemProvider>
			);

			expect( screen.getByText( expectedText ) ).toBeInTheDocument();
		} );
	} );
} );
