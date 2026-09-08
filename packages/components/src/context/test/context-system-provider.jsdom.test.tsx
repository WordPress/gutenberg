import { render, screen } from '@testing-library/react';
import styled from '@emotion/styled';
import type {
	ComponentPropsWithoutRef,
	ForwardedRef,
	ReactElement,
	ReactNode,
} from 'react';
import { cloneElement } from '@wordpress/element';
import warn from '@wordpress/warning';
import { contextConnect } from '../context-connect';
import { ContextSystemProvider } from '../context-system-provider';
import { useContextSystem } from '../use-context-system';

jest.mock( '@wordpress/warning', () => jest.fn() );

const View = styled.div``;

type TestComponentProps = ComponentPropsWithoutRef< 'div' > & {
	quote?: ReactNode;
};

function TestComponent(
	props: TestComponentProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	return <View { ...useContextSystem( props, 'Component' ) } ref={ ref } />;
}

function TestComponentWithQuote(
	props: TestComponentProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const { quote, ...otherProps } = useContextSystem( props, 'Component' );
	return (
		<View { ...otherProps } ref={ ref }>
			{ quote }
		</View>
	);
}

describe( 'props', () => {
	test( 'should not warn when rerendered without a value', () => {
		jest.mocked( warn ).mockClear();

		const { rerender } = render(
			<ContextSystemProvider>
				<div />
			</ContextSystemProvider>
		);

		rerender(
			<ContextSystemProvider>
				<div />
			</ContextSystemProvider>
		);

		expect( warn ).not.toHaveBeenCalled();
	} );

	test( 'should render correctly', () => {
		const ConnectedComponent = contextConnect( TestComponent, 'Component' );
		const { container } = render(
			<ContextSystemProvider>
				<ConnectedComponent />
			</ContextSystemProvider>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should render context props', () => {
		const ConnectedComponent = contextConnect(
			TestComponentWithQuote,
			'Component'
		);

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

		expect( container ).toMatchSnapshot();
		expect( screen.getByText( 'Code is Poetry' ) ).toBeVisible();
	} );

	test( 'should render _override props', () => {
		const ConnectedComponent = contextConnect(
			TestComponentWithQuote,
			'Component'
		);

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

		expect( container ).toMatchSnapshot();

		const element = screen.getByText( 'Code is Poetry' );
		expect( element ).toBeVisible();
		expect( element ).toHaveClass( 'test-component' );

		expect( screen.queryByText( 'WordPress.org' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'children', () => {
	test( 'should pass through children', () => {
		const ConnectedComponent = contextConnect( TestComponent, 'Component' );

		render(
			<ContextSystemProvider>
				<ConnectedComponent>Pass through</ConnectedComponent>
			</ContextSystemProvider>
		);

		expect( screen.getByText( 'Pass through' ) ).toBeInTheDocument();
	} );

	test( 'should not accept children via `context`', () => {
		const ConnectedComponent = contextConnect( TestComponent, 'Component' );

		render(
			<ContextSystemProvider
				// @ts-expect-error Verify that the unsupported `context` prop is ignored.
				context={ { Component: { children: 'Override' } } }
			>
				<ConnectedComponent />
			</ContextSystemProvider>
		);

		expect( screen.queryByText( 'Override' ) ).not.toBeInTheDocument();
	} );

	// This matches the behavior for normal, non-context-connected components.
	test( 'should not override inherent children', () => {
		const Component = (
			props: TestComponentProps,
			ref: ForwardedRef< HTMLDivElement >
		) => (
			<View { ...useContextSystem( props, 'Component' ) } ref={ ref }>
				Inherent
			</View>
		);
		const ConnectedComponent = contextConnect( Component, 'Component' );
		const NormalComponent = (
			props: ComponentPropsWithoutRef< 'div' >
		) => <div { ...props }>Inherent</div>;

		render(
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
		type CloneComponentProps = {
			content: ReactElement;
			children?: ReactNode;
			className?: string;
		};
		const ComponentThatClones = (
			{ content, ...props }: CloneComponentProps,
			ref: ForwardedRef< HTMLElement >
		) => {
			void ref;
			return cloneElement(
				content,
				useContextSystem( props, 'ComponentThatClones' )
			);
		};
		const ConnectedComponentThatClones = contextConnect(
			ComponentThatClones,
			'ComponentThatClones'
		);

		test( 'should not override cloned inherent children with implicit `undefined` children', () => {
			render(
				<ContextSystemProvider>
					<ConnectedComponentThatClones
						content={ <span>Inherent</span> }
					/>
				</ContextSystemProvider>
			);
			expect( screen.getByText( 'Inherent' ) ).toBeInTheDocument();
		} );

		test( 'should override cloned inherent children with explicit children', () => {
			render(
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
