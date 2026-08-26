import { render, screen, within } from '@testing-library/react';
import { createPortal, useState } from '@wordpress/element';
import { registerStyle } from '@wordpress/style-runtime';
import { CardBody } from '../../card';
import StyleProvider from '../../style-provider';
import { Scrollable } from '../index';
import styles from '../style.module.scss';

type GlobalScopeWithStyleRuntime = typeof globalThis & {
	__wpStyleRuntime?: unknown;
};

function IframeWithStyleProvider( {
	children,
}: {
	children: React.ReactNode;
} ) {
	const [ iframe, setIframe ] = useState< HTMLIFrameElement | null >( null );
	const iframeDocument = iframe?.contentDocument;

	return (
		<iframe title="CardBody document" ref={ setIframe }>
			{ iframeDocument &&
				createPortal(
					<StyleProvider document={ iframeDocument }>
						{ children }
					</StyleProvider>,
					iframeDocument.body
				) }
		</iframe>
	);
}

describe( 'props', () => {
	test( 'should render correctly', () => {
		render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable' );

		expect( scrollable ).toHaveClass( 'components-scrollable' );
		expect( scrollable ).toHaveClass( styles.scrollable );
		expect( scrollable ).toHaveClass( styles[ 'scroll-y' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'smooth-scroll' ] );
	} );

	test( 'should render smoothScroll', () => {
		render(
			<Scrollable smoothScroll data-testid="smooth-scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		expect( screen.getByTestId( 'smooth-scrollable' ) ).toHaveClass(
			styles[ 'smooth-scroll' ]
		);
	} );

	test( 'should render scrollDirection x', () => {
		render(
			<Scrollable scrollDirection="x" data-testid="scrollable-x">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable-x' );

		expect( scrollable ).toHaveClass( styles[ 'scroll-x' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'scroll-y' ] );
	} );

	test( 'should render scrollDirection auto', () => {
		render(
			<Scrollable scrollDirection="auto" data-testid="scrollable-auto">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable-auto' );

		expect( scrollable ).toHaveClass( styles[ 'scroll-auto' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'scroll-y' ] );
	} );
} );

describe( 'CardBody isScrollable height', () => {
	const globalScope = globalThis as GlobalScopeWithStyleRuntime;

	afterEach( () => {
		// Style runtime injects outside Testing Library's container.
		/* eslint-disable testing-library/no-node-access */
		document
			.querySelectorAll( 'style[data-wp-hash="scrollable-height"]' )
			.forEach( ( style ) => style.remove() );
		/* eslint-enable testing-library/no-node-access */

		delete globalScope.__wpStyleRuntime;
	} );

	test( 'should keep height 100% in the main document and in an iframe', () => {
		// CSS module registration is skipped by the Jest transform, so mirror the
		// generated production call explicitly.
		registerStyle(
			'scrollable-height',
			`.${ styles.scrollable }{height:100%;}`
		);

		render( <CardBody data-testid="card-body">Body</CardBody> );
		render(
			<CardBody isScrollable data-testid="scrollable-body">
				Body
			</CardBody>
		);

		expect(
			getComputedStyle( screen.getByTestId( 'card-body' ) ).height
		).toBe( 'auto' );
		expect(
			getComputedStyle( screen.getByTestId( 'scrollable-body' ) ).height
		).toBe( '100%' );

		render(
			<IframeWithStyleProvider>
				<CardBody isScrollable data-testid="scrollable-body-iframe">
					Body
				</CardBody>
			</IframeWithStyleProvider>
		);

		const iframeDocument =
			screen.getByTitle< HTMLIFrameElement >( 'CardBody document' )
				.contentDocument!;

		const iframeBody = within( iframeDocument.body ).getByTestId(
			'scrollable-body-iframe'
		);

		expect(
			iframeDocument.defaultView!.getComputedStyle( iframeBody ).height
		).toBe( '100%' );
	} );
} );
