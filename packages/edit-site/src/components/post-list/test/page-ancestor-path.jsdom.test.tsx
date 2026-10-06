import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageAncestorPath from '../page-ancestor-path';

describe( 'PageAncestorPath', () => {
	it( 'shows ancestor labels without links, a navigation landmark or a heading', () => {
		render( <PageAncestorPath labels={ [ 'North', 'East' ] } /> );

		expect(
			screen.getByRole( 'group', { name: 'Breadcrumbs' } )
		).toHaveTextContent( 'North/East' );
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'navigation' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing without ancestors', () => {
		const { container } = render( <PageAncestorPath labels={ [] } /> );
		expect( container ).toBeEmptyDOMElement();
	} );
} );
