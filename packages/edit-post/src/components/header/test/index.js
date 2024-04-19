/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { PostPublishButtonOrToggle } from '../post-publish-button-or-toggle';

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match' );

describe( 'PostPublishButtonOrToggle should render a', () => {
	afterEach( () => {
		useViewportMatch.mockRestore();
	} );

	it( 'button when the post is published (1)', () => {
		render( <PostPublishButtonOrToggle isPublished /> );
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'button when the post is scheduled (2)', () => {
		render( <PostPublishButtonOrToggle isScheduled isBeingScheduled /> );
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'button when the post is pending and cannot be published but the viewport is >= medium (3)', () => {
		render(
			<PostPublishButtonOrToggle isPending hasPublishAction={ false } />
		);

		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'toggle when post is not (1), (2), (3), the viewport is <= medium, and the publish sidebar is enabled', () => {
		useViewportMatch.mockReturnValue( true );
		render( <PostPublishButtonOrToggle isPublishSidebarEnabled /> );
		expect(
			screen.getByRole( 'button', { name: 'Publish' } )
		).toBeVisible();
	} );

	it( 'button when post is not (1), (2), (3), the viewport is >= medium, and the publish sidebar is disabled', () => {
		render(
			<PostPublishButtonOrToggle isPublishSidebarEnabled={ false } />
		);
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );
} );
