import { renderToStaticMarkup } from 'react-dom/server';
import * as Breadcrumb from '../index';

describe( 'Breadcrumb server rendering', () => {
	it( 'renders the complete semantic trail before client measurement', () => {
		const view = renderToStaticMarkup(
			<Breadcrumb.Root>
				<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
				<Breadcrumb.LinkItem href="/section?view=all#latest">
					Section
				</Breadcrumb.LinkItem>
				<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		);

		expect( view ).toContain( '<nav' );
		expect( view ).toContain( '<ol' );
		expect( view ).toContain( 'href="/"' );
		expect( view ).toContain( 'href="/section?view=all#latest"' );
		expect( view ).toContain( 'aria-current="page"' );
		expect( view ).not.toContain( 'aria-haspopup="menu"' );
		// @ts-expect-error -- Matcher provided by @wordpress/jest-console.
		expect( console ).toHaveErrored();
	} );
} );
