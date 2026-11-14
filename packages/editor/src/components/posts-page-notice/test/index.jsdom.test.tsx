import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import PostsPageNotice from '../';

vi.mock( import( '@wordpress/a11y' ), () => ( {
	speak: vi.fn(),
} ) );

const MESSAGE =
	'You are currently editing the page that shows your latest posts.';

describe( 'PostsPageNotice', () => {
	it( 'shows a warning that cannot be dismissed', () => {
		render( <PostsPageNotice /> );
		expect( screen.getByText( MESSAGE ) ).toBeVisible();
		expect( screen.getByText( 'Warning notice' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Close' } )
		).not.toBeInTheDocument();
	} );

	it( 'announces the warning once when it is shown', () => {
		const { rerender } = render( <PostsPageNotice /> );
		rerender( <PostsPageNotice /> );
		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( MESSAGE );
	} );
} );
