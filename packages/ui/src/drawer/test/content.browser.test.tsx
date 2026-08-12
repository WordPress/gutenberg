import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { createRef } from '@wordpress/element';
import * as Drawer from '..';

describe( 'Drawer.Content browser rendering', () => {
	it( 'renders the swipe marker as a layout box inside the scroll container', async () => {
		const contentRef = createRef< HTMLDivElement >();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Title>Title</Drawer.Title>
					<Drawer.Content ref={ contentRef }>
						<p>Body</p>
					</Drawer.Content>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Open' } ) );
		await waitFor( () => {
			expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		// Direct DOM access is intentional: the exact wrapper relationship is
		// what preserves mouse-drag swipe dismissal in the popup-edge gutter.
		// eslint-disable-next-line testing-library/no-node-access
		const marker = contentRef.current?.firstElementChild;
		expect( marker ).toHaveAttribute( 'data-drawer-content' );
		expect( getComputedStyle( marker as Element ).display ).toBe( 'block' );
	} );
} );
