import { renderToStaticMarkup } from 'react-dom/server';
import * as Breadcrumbs from '../index';

describe( 'Breadcrumbs server rendering', () => {
	it( 'renders the complete semantic trail before client measurement', () => {
		const view = renderToStaticMarkup(
			<Breadcrumbs.Root>
				<Breadcrumbs.LinkItem href="/">Home</Breadcrumbs.LinkItem>
				<Breadcrumbs.LinkItem href="/section?view=all#latest">
					Section
				</Breadcrumbs.LinkItem>
				<Breadcrumbs.CurrentItem>Current</Breadcrumbs.CurrentItem>
			</Breadcrumbs.Root>
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
