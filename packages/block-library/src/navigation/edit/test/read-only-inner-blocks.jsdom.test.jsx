import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ReadOnlyNavigationInnerBlocks from '../read-only-inner-blocks';

describe( 'ReadOnlyNavigationInnerBlocks', () => {
	it( 'renders menu HTML without making its links interactive', async () => {
		render(
			<ReadOnlyNavigationInnerBlocks content='<a href="/">Home</a>' />
		);

		const link = screen.getByRole( 'link', { name: 'Home' } );
		expect( link ).toBeVisible();

		await waitFor( () => {
			expect( link ).toHaveAttribute( 'inert', 'true' );
		} );
	} );
} );
