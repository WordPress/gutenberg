import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import PostDateView from '../post-date-view';
import type { BasePost } from '../../../dataviews/types';

vi.mock( import( '@wordpress/data' ), { spy: true } );

/**
 * Sets whether the date of the edited post floats.
 *
 * @param isFloating Whether the date floats.
 */
function mockIsFloating( isFloating: boolean ) {
	vi.mocked( useSelect ).mockReturnValue( isFloating );
}

function DefaultView() {
	return <span>Default view</span>;
}

function renderPostDateView( item: Partial< BasePost > ) {
	return render(
		<PostDateView
			{ ...( {
				item,
				field: { id: 'date' },
			} as unknown as DataViewRenderFieldProps< BasePost > ) }
			defaultView={ DefaultView }
		/>
	);
}

describe( 'PostDateView', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockIsFloating( false );
	} );

	it( 'labels the publish date of a pending post with a later modified date', () => {
		const { container } = renderPostDateView( {
			status: 'pending',
			date: '2026-12-25T10:00:00',
			modified: '2026-10-28T12:02:01',
		} );

		expect( container ).toHaveTextContent(
			'Publish: Dec 25, 2026 10:00 am'
		);
		expect( container ).not.toHaveTextContent( 'Modified' );
	} );

	it( 'labels the publish date of a draft with a date in the past', () => {
		const { container } = renderPostDateView( {
			status: 'draft',
			date: '2025-01-05T09:00:00',
			modified: '2026-10-28T12:02:01',
		} );

		expect( container ).toHaveTextContent( 'Publish: Jan 5, 2025 9:00 am' );
	} );

	it( 'shows that a draft without a date of its own is published immediately', () => {
		mockIsFloating( true );

		renderPostDateView( {
			status: 'draft',
			date: '2026-10-28T12:02:01',
			modified: '2026-10-28T12:02:01',
		} );

		expect(
			screen.getByText( 'Publish: Immediately' )
		).toBeInTheDocument();
	} );

	it( 'labels the date of a private post as its publish date', () => {
		const { container } = renderPostDateView( {
			status: 'private',
			date: '2025-01-05T09:00:00',
			modified: '2026-10-28T12:02:01',
		} );

		expect( container ).toHaveTextContent(
			'Published: Jan 5, 2025 9:00 am'
		);
	} );

	it.each( [ 'publish', 'future' ] as const )(
		'leaves a %s post to the default view of the field',
		( status ) => {
			renderPostDateView( {
				status,
				date: '2025-01-05T09:00:00',
				modified: '2026-10-28T12:02:01',
			} );

			expect( screen.getByText( 'Default view' ) ).toBeInTheDocument();
		}
	);
} );
