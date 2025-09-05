/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostPublishButtonOrToggle from '../post-publish-button-or-toggle';

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match' );
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

describe( 'PostPublishButtonOrToggle should render a', () => {
	afterEach( () => {
		useViewportMatch.mockRestore();
	} );

	it( 'button when the post is published (1)', () => {
		useSelect.mockImplementation( () => ( {
			isPublished: true,
		} ) );
		render( <PostPublishButtonOrToggle /> );
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'button when the post is scheduled (2)', () => {
		useSelect.mockImplementation( () => ( {
			isScheduled: true,
			isBeingScheduled: true,
		} ) );
		render( <PostPublishButtonOrToggle /> );
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'button when the post is pending and cannot be published but the viewport is >= medium (3)', () => {
		useSelect.mockImplementation( () => ( {
			isPending: true,
			hasPublishAction: false,
		} ) );
		render( <PostPublishButtonOrToggle /> );

		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );

	it( 'toggle when post is not (1), (2), (3), the viewport is <= medium, and the publish sidebar is enabled', () => {
		useViewportMatch.mockReturnValue( true );
		useSelect.mockImplementation( () => ( {
			isPublishSidebarEnabled: true,
		} ) );
		render( <PostPublishButtonOrToggle isPublishSidebarEnabled /> );
		expect(
			screen.getByRole( 'button', { name: 'Publish' } )
		).toBeVisible();
	} );

	it( 'button when post is not (1), (2), (3), the viewport is >= medium, and the publish sidebar is disabled', () => {
		useSelect.mockImplementation( () => ( {
			isPublishSidebarEnabled: false,
		} ) );
		render( <PostPublishButtonOrToggle /> );
		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
	} );
} );
