/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MediaReplaceFlow from '../';

const noop = () => {};

function TestWrapper() {
	const [ mediaURL, setMediaURL ] = useState( 'https://example.media' );
	return (
		<MediaReplaceFlow
			mediaId={ 1 }
			mediaURL={ mediaURL }
			allowedTypes={ [ 'png' ] }
			accept="image/*"
			onSelect={ noop }
			onSelectURL={ setMediaURL }
			onError={ noop }
			onCloseModal={ noop }
		/>
	);
}

describe( 'General media replace flow', () => {
	it( 'renders successfully', () => {
		render( <TestWrapper /> );

		expect(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		).toBeVisible();
	} );

	it( 'renders replace menu', async () => {
		const user = userEvent.setup();

		render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);
		const uploadMenu = screen.getByRole( 'menu' );

		await waitFor( () => expect( uploadMenu ).toBePositionedPopover() );

		await waitFor( () => expect( uploadMenu ).toBeVisible() );
	} );

	it( 'displays media URL', async () => {
		const user = userEvent.setup();

		render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);

		const link = screen.getByRole( 'link', {
			name: 'example.media (opens in a new tab)',
		} );

		await waitFor( () => expect( link ).toBePositionedPopover() );

		expect( link ).toHaveAttribute( 'href', 'https://example.media' );
	} );

	it( 'edits media URL', async () => {
		const user = userEvent.setup();

		render( <TestWrapper /> );

		await user.click(
			screen.getByRole( 'button', {
				expanded: false,
				name: 'Replace',
			} )
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'link', {
					name: 'example.media (opens in a new tab)',
				} )
			).toBePositionedPopover()
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Edit link',
			} )
		);

		const mediaURLInput = screen.getByRole( 'combobox', {
			name: 'Search or type URL',
			expanded: false,
		} );

		await user.clear( mediaURLInput );
		await user.type( mediaURLInput, 'https://new.example.media' );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Save',
			} )
		);

		expect(
			screen.getByRole( 'link', {
				name: 'new.example.media (opens in a new tab)',
			} )
		).toHaveAttribute( 'href', 'https://new.example.media' );
	} );
} );
