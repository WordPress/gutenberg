/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PostPublishButtonOrToggle } from '../post-publish-button-or-toggle';

describe( 'PostPublishButtonOrToggle should render a', () => {
	it( 'button when the post is published (1)', () => {
		render( <PostPublishButtonOrToggle isPublished={ true } /> );
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'button when the post is scheduled (2)', () => {
		render(
			<PostPublishButtonOrToggle
				isScheduled={ true }
				isBeingScheduled={ true }
			/>
		);
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'button when the post is pending and cannot be published but the viewport is >= medium (3)', () => {
		render(
			<PostPublishButtonOrToggle
				isPending={ true }
				hasPublishAction={ false }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'toggle when post is not (1), (2), (3), the viewport is >= medium, and the publish sidebar is enabled', () => {
		render(
			<PostPublishButtonOrToggle isPublishSidebarEnabled={ true } />
		);
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
