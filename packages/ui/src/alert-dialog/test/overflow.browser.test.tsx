import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { createRef } from '@wordpress/element';
import * as AlertDialog from '..';

describe( 'AlertDialog browser overflow behavior', () => {
	it( 'focuses an action instead of its overflowing scroll container', async () => {
		const popupRef = createRef< HTMLDivElement >();

		render(
			<AlertDialog.Root>
				<AlertDialog.Trigger>Open</AlertDialog.Trigger>
				<AlertDialog.Popup
					ref={ popupRef }
					title="Title"
					style={ { maxHeight: 240 } }
				>
					<div style={ { height: 2000 } }>Long content</div>
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Open' } ) );

		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		// Direct access is intentional: the scroll container is an internal
		// implementation element with no extra landmark semantics.
		// eslint-disable-next-line testing-library/no-node-access
		const scroller = popupRef.current?.querySelector< HTMLDivElement >(
			'[data-wp-ui-overlay-scroll-container]'
		);
		expect( scroller ).toBeInstanceOf( HTMLDivElement );

		await waitFor( () => {
			expect( scroller ).toHaveAttribute( 'tabindex', '0' );
			expect( scroller?.scrollHeight ).toBeGreaterThan(
				scroller?.clientHeight ?? 0
			);
			expect(
				screen.getByRole( 'button', { name: 'Cancel' } )
			).toHaveFocus();
		} );
		expect( scroller ).not.toHaveFocus();
	} );
} );
