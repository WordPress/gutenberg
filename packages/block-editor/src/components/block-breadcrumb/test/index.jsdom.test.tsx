import { describe, expect, it, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import BlockBreadcrumb from '../';

describe( 'BlockBreadcrumb', () => {
	it( 'displays the document breadcrumb when no block is selected', () => {
		render( <BlockBreadcrumb /> );
		expect(
			screen.getByRole( 'list', { name: 'Block breadcrumb' } )
		).toBeVisible();
		expect(
			screen.getByText( 'Document', {
				selector: '[aria-current="true"]',
			} )
		).toBeVisible();
	} );

	describe( 'Root label text', () => {
		test( 'displays the supplied document label', () => {
			render( <BlockBreadcrumb rootLabelText="Tuhinga" /> );

			const rootLabelText = screen.getByText( 'Tuhinga', {
				selector: '[aria-current="true"]',
			} );
			const rootLabelTextDefault = screen.queryByText( 'Document' );

			expect( rootLabelTextDefault ).not.toBeInTheDocument();
			expect( rootLabelText ).toBeInTheDocument();
		} );
	} );
} );
