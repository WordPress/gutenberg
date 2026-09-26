import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BreadcrumbPath } from '../..';

describe( 'BreadcrumbPath', () => {
	it( 'shows ancestor labels without links, a navigation landmark or a heading', () => {
		render(
			<BreadcrumbPath
				items={ [ { label: 'North' }, { label: 'East' } ] }
			/>
		);

		expect(
			screen.getByRole( 'group', { name: 'Breadcrumbs' } )
		).toHaveTextContent( 'North/East' );
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'navigation' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing without ancestors', () => {
		const { container } = render( <BreadcrumbPath items={ [] } /> );
		expect( container ).toBeEmptyDOMElement();
	} );
} );
