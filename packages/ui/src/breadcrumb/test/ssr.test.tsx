import { describe, expect, it } from 'vitest';
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
				<Breadcrumb.CurrentItem aria-current="true">
					Current
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		);

		expect( view ).toContain( '<nav' );
		expect( view ).toContain( '<ol' );
		expect( view ).toContain( 'href="/"' );
		expect( view ).toContain( 'href="/section?view=all#latest"' );
		expect( view ).toContain( 'aria-current="true"' );
		expect( view ).not.toContain( 'aria-haspopup="menu"' );
	} );
	it.each( [
		[ undefined, 'navigation', 'page' ],
		[ true, 'group', 'true' ],
		[ 'true', 'group', 'true' ],
		[ 'page', 'navigation', 'page' ],
		[ false, 'navigation', 'false' ],
	] as const )(
		'renders a current-only trail with aria-current=%j and role=%s on the server',
		( ariaCurrent, role, renderedAriaCurrent ) => {
			const view = renderToStaticMarkup(
				<Breadcrumb.Root aria-label="Hierarchy">
					<Breadcrumb.CurrentItem
						aria-current={ ariaCurrent }
						render={ <span aria-current="step" /> }
					>
						Document
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			expect( view ).toContain( `role="${ role }"` );
			expect( view ).toContain(
				`aria-current="${ renderedAriaCurrent }"`
			);
			expect( view.match( /aria-current=/g ) ).toHaveLength( 1 );
		}
	);

	it( 'infers selection semantics from declared buttons before measurement', () => {
		const view = renderToStaticMarkup(
			<Breadcrumb.Root aria-label="Hierarchy">
				<Breadcrumb.ButtonItem>Document</Breadcrumb.ButtonItem>
				<Breadcrumb.CurrentItem>Paragraph</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		);
		expect( view ).toContain( 'role="group"' );
		expect( view ).toContain( 'type="button"' );
		expect( view ).toContain( 'aria-current="true"' );
		expect( view ).not.toContain( '<nav' );
	} );
} );
