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
		// eslint-disable-next-line no-console -- Inspect the captured arguments so the assertion can match React's exact warning while allowing its generated component stack.
		const firstErrorCall = ( console.error as jest.Mock ).mock.calls[ 0 ];
		expect( console ).toHaveErroredWith(
			"Warning: useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format. This will lead to a mismatch between the initial, non-hydrated UI and the intended UI. To avoid this, useLayoutEffect should only be used in components that render exclusively on the client. See https://reactjs.org/link/uselayouteffect-ssr for common fixes.%s",
			firstErrorCall[ 1 ]
		);
	} );
} );
