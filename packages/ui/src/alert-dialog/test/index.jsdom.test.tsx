import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as AlertDialog from '..';

vi.mock( import( '@wordpress/a11y' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	speak: vi.fn(),
} ) );

describe( 'AlertDialog', () => {
	it( 'forwards ref', () => {
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();

		render(
			<AlertDialog.Root defaultOpen>
				<AlertDialog.Trigger ref={ triggerRef }>
					Open
				</AlertDialog.Trigger>
				<AlertDialog.Popup ref={ popupRef } title="Test Title">
					Content
				</AlertDialog.Popup>
			</AlertDialog.Root>
		);

		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	describe( 'overlay scroll container', () => {
		// AlertDialog's scroll container is a library-internal `<div>` with
		// no role or testid — a `querySelector` is the only way to reach
		// it from a test. The Testing Library rule is disabled for this
		// helper because that's exactly what it's flagging.
		const findScroller = ( popup: HTMLElement | null ): HTMLDivElement => {
			if ( ! popup ) {
				throw new Error(
					'Popup ref not attached — did AlertDialog.Popup render?'
				);
			}
			// eslint-disable-next-line testing-library/no-node-access
			const el = popup.querySelector(
				'[data-wp-ui-overlay-scroll-container]'
			);
			if ( ! ( el instanceof HTMLDivElement ) ) {
				throw new Error(
					'Scroll container not found inside AlertDialog popup'
				);
			}
			return el;
		};

		it( 'renders an internal scroll container with data-wp-ui-overlay-scroll-container', async () => {
			const popupRef = createRef< HTMLDivElement >();

			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup ref={ popupRef } title="Title">
						Body
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			expect( findScroller( popupRef.current ) ).toBeInstanceOf(
				HTMLDivElement
			);
		} );

		it( 'is always modal (data-wp-ui-overlay-modal present on popup)', async () => {
			const popupRef = createRef< HTMLDivElement >();

			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup ref={ popupRef } title="Title">
						Body
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			expect( popupRef.current ).toHaveAttribute(
				'data-wp-ui-overlay-modal'
			);
		} );

		it( 'pins header and footer outside the scroller when sticky props are true (default)', async () => {
			const popupRef = createRef< HTMLDivElement >();

			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup ref={ popupRef } title="Title">
						Body
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			const scroller = findScroller( popupRef.current );
			const title = screen.getByRole( 'heading', { name: 'Title' } );
			const ok = screen.getByRole( 'button', { name: 'OK' } );

			// Default: chrome sits outside the scroll container.
			expect( scroller ).not.toContainElement( title );
			expect( scroller ).not.toContainElement( ok );
		} );

		it( 'nests header and footer inside the scroller when stickyHeader and stickyFooter are false', async () => {
			const popupRef = createRef< HTMLDivElement >();

			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup
						ref={ popupRef }
						title="Title"
						stickyHeader={ false }
						stickyFooter={ false }
					>
						Body
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			const scroller = findScroller( popupRef.current );
			const title = screen.getByRole( 'heading', { name: 'Title' } );
			const ok = screen.getByRole( 'button', { name: 'OK' } );

			expect( scroller ).toContainElement( title );
			expect( scroller ).toContainElement( ok );
		} );

		it( 'toggles tabindex="0" on the scroller based on overflow', async () => {
			const popupRef = createRef< HTMLDivElement >();

			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup ref={ popupRef } title="Title">
						Body
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			const scroller = findScroller( popupRef.current );

			Object.defineProperty( scroller, 'scrollHeight', {
				configurable: true,
				value: 500,
			} );
			Object.defineProperty( scroller, 'clientHeight', {
				configurable: true,
				value: 100,
			} );
			Object.defineProperty( scroller, 'scrollTop', {
				configurable: true,
				value: 0,
			} );

			act( () => {
				scroller.dispatchEvent(
					new Event( 'scroll', { bubbles: true } )
				);
			} );

			expect( scroller ).toHaveAttribute( 'tabindex', '0' );

			Object.defineProperty( scroller, 'scrollHeight', {
				configurable: true,
				value: 100,
			} );

			act( () => {
				scroller.dispatchEvent(
					new Event( 'scroll', { bubbles: true } )
				);
			} );

			expect( scroller ).not.toHaveAttribute( 'tabindex' );
		} );

		it( 'toggles data-wp-ui-overlay-scrolled-from-* on the scroller based on scroll position', async () => {
			const popupRef = createRef< HTMLDivElement >();

			render(
				<AlertDialog.Root defaultOpen>
					<AlertDialog.Trigger>Open</AlertDialog.Trigger>
					<AlertDialog.Popup ref={ popupRef } title="Title">
						Body
					</AlertDialog.Popup>
				</AlertDialog.Root>
			);

			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			// JSDOM doesn't lay out elements, so we simulate an
			// overflowing scroll container by stubbing layout metrics
			// per scenario and dispatching a scroll event.
			const scroller = findScroller( popupRef.current );
			Object.defineProperty( scroller, 'scrollHeight', {
				configurable: true,
				value: 500,
			} );
			Object.defineProperty( scroller, 'clientHeight', {
				configurable: true,
				value: 100,
			} );

			const setScrollTop = ( value: number ) => {
				Object.defineProperty( scroller, 'scrollTop', {
					configurable: true,
					value,
				} );
				act( () => {
					scroller.dispatchEvent(
						new Event( 'scroll', { bubbles: true } )
					);
				} );
			};

			setScrollTop( 0 );
			expect( scroller ).not.toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( scroller ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);

			setScrollTop( 200 );
			expect( scroller ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( scroller ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);

			setScrollTop( 400 );
			expect( scroller ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( scroller ).not.toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);
		} );
	} );
} );
