import { afterEach, describe, expect, test } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
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
	test( 'should render correctly', async () => {
		await render(
			<div data-testid="scrollable-parent" style={ { height: 120 } }>
				<Scrollable data-testid="scrollable">
					WordPress.org - Code is Poetry
				</Scrollable>
			</div>
		);

		const scrollable = screen.getByTestId( 'scrollable' );
		const computedStyles = getComputedStyle( scrollable );

		expect( scrollable ).toHaveClass( 'components-scrollable' );
		expect( scrollable ).toHaveClass( styles.scrollable );
		expect( scrollable ).toHaveClass( styles[ 'scroll-y' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'smooth-scroll' ] );
		expect( computedStyles.height ).toBe(
			getComputedStyle( screen.getByTestId( 'scrollable-parent' ) ).height
		);
		expect( computedStyles.overflowY ).toBe( 'auto' );
	} );

	test( 'should render smoothScroll', async () => {
		await render(
			<Scrollable data-testid="scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);
		await render(
			<Scrollable smoothScroll data-testid="smooth-scrollable">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		expect( screen.getByTestId( 'smooth-scrollable' ) ).toHaveClass(
			styles[ 'smooth-scroll' ]
		);
		expect(
			getComputedStyle( screen.getByTestId( 'smooth-scrollable' ) )
				.scrollBehavior
		).toBe( 'smooth' );
		expect(
			getComputedStyle( screen.getByTestId( 'scrollable' ) )
				.scrollBehavior
		).toBe( 'auto' );
	} );

	test( 'supports native scrolling', async () => {
		await render(
			<div style={ { height: 100, width: 100 } }>
				<Scrollable data-testid="scrollable">
					<div style={ { height: 300 } }>Content</div>
				</Scrollable>
			</div>
		);
		const scrollable = screen.getByTestId( 'scrollable' );

		scrollable.scrollTo( { top: 100 } );

		expect( scrollable.scrollTop ).toBe( 100 );
	} );

	test( 'should render scrollDirection x', async () => {
		await render(
			<Scrollable scrollDirection="x" data-testid="scrollable-x">
				WordPress.org - Code is Poetry
			</Scrollable>
		);

		const scrollable = screen.getByTestId( 'scrollable-x' );

		expect( scrollable ).toHaveClass( styles[ 'scroll-x' ] );
		expect( scrollable ).not.toHaveClass( styles[ 'scroll-y' ] );
	} );

	test( 'should render scrollDirection auto', async () => {
		await render(
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

	test( 'should keep height 100% in the main document and in an iframe', async () => {
		// Register explicitly so this test isolates StyleProvider's
		// cross-document injection from the package build transform.
		registerStyle(
			'scrollable-height',
			`.${ styles.scrollable }{height:100%;}`
		);

		await render(
			<div style={ { height: 200 } }>
				<CardBody data-testid="card-body">Body</CardBody>
				<CardBody isScrollable data-testid="scrollable-body">
					Body
				</CardBody>
			</div>
		);

		expect(
			getComputedStyle( screen.getByTestId( 'card-body' ) ).height
		).not.toBe( '200px' );
		expect(
			getComputedStyle( screen.getByTestId( 'scrollable-body' ) ).height
		).toBe( '200px' );

		await render(
			<IframeWithStyleProvider>
				<div style={ { height: 200 } }>
					<CardBody isScrollable data-testid="scrollable-body-iframe">
						Body
					</CardBody>
				</div>
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
		).toBe( '200px' );
	} );
} );
