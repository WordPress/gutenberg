import { render, screen } from '@testing-library/react';
import discussionField from '../index';
import type { BasePost } from '../../../types';

const Discussion = discussionField.render!;

function renderDiscussion( item: Partial< BasePost > ) {
	return render(
		<Discussion item={ item as BasePost } field={ {} as never } />
	);
}

describe( 'discussion field', () => {
	it( 'renders nothing when neither status is known', () => {
		// Both statuses absent used to fall through to "Closed", reporting a
		// setting the post may not have. Bulk Quick Edit starts from an empty
		// record, so this is the state it renders before any edit.
		const { container } = renderDiscussion( {} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'reports Open when comments and pings are both open', () => {
		renderDiscussion( { comment_status: 'open', ping_status: 'open' } );

		expect( screen.getByText( 'Open' ) ).toBeVisible();
	} );

	it( 'reports Comments only when pings are closed', () => {
		renderDiscussion( { comment_status: 'open', ping_status: 'closed' } );

		expect( screen.getByText( 'Comments only' ) ).toBeVisible();
	} );

	it( 'reports Pings only when comments are closed', () => {
		renderDiscussion( { comment_status: 'closed', ping_status: 'open' } );

		expect( screen.getByText( 'Pings only' ) ).toBeVisible();
	} );

	it( 'reports Closed when both are closed', () => {
		renderDiscussion( { comment_status: 'closed', ping_status: 'closed' } );

		expect( screen.getByText( 'Closed' ) ).toBeVisible();
	} );

	it( 'reports only on comments when the ping status is unknown', () => {
		// Editing just the comment setting in bulk used to render
		// "Comments only", claiming pings are closed for posts whose ping
		// setting is not being changed.
		renderDiscussion( { comment_status: 'open' } );

		expect( screen.getByText( 'Comments open' ) ).toBeVisible();

		renderDiscussion( { comment_status: 'closed' } );

		expect( screen.getByText( 'Comments closed' ) ).toBeVisible();
	} );

	it( 'reports only on pings when the comment status is unknown', () => {
		renderDiscussion( { ping_status: 'open' } );

		expect( screen.getByText( 'Pings open' ) ).toBeVisible();

		renderDiscussion( { ping_status: 'closed' } );

		expect( screen.getByText( 'Pings closed' ) ).toBeVisible();
	} );
} );
