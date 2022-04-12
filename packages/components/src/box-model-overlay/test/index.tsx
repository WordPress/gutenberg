/**
 * External dependencies
 */
import { render, screen, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BoxModelOverlay from '../index';
import type { BoxModelOverlayHandle } from '../index';
import { SlotFillProvider, Popover } from '../..';

const DEFAULT_SHOW_VALUES = {
	margin: {
		top: true,
		right: true,
		bottom: true,
		left: true,
	},
	padding: {
		top: true,
		right: true,
		bottom: true,
		left: true,
	},
};

// Mock ResizeObserver since it's not available in JSDOM yet.
beforeAll( () => {
	window.ResizeObserver = jest.fn( () => ( {
		observe: () => {},
		unobserve: () => {},
		disconnect: () => {},
	} ) );
} );
afterAll( () => {
	window.ResizeObserver = undefined;
} );

it( 'renders the overlay visible with the children prop', () => {
	render(
		<BoxModelOverlay
			data-testid="box-model-overlay"
			showValues={ DEFAULT_SHOW_VALUES }
		>
			<div data-testid="box" style={ { height: 300, width: 300 } } />
		</BoxModelOverlay>
	);

	const overlay = screen.getByTestId( 'box-model-overlay' );

	expect( overlay ).toBeVisible();
} );

it( 'renders the overlay visible with the targetRef prop', () => {
	const targetRef = createRef< HTMLDivElement >();

	render(
		<>
			<div
				data-testid="box"
				style={ { height: 300, width: 300 } }
				ref={ targetRef }
			/>
			<BoxModelOverlay
				data-testid="box-model-overlay"
				showValues={ DEFAULT_SHOW_VALUES }
				targetRef={ targetRef }
			/>
		</>
	);

	const box = screen.getByTestId( 'box' );
	const overlay = screen.getByTestId( 'box-model-overlay' );

	act( () => {
		expect( targetRef.current ).toBe( box );
	} );

	expect( overlay ).toBeVisible();
} );

it( 'allows to call update imperatively via ref', async () => {
	const overlayRef = createRef< BoxModelOverlayHandle >();

	render(
		<BoxModelOverlay
			data-testid="box-model-overlay"
			showValues={ DEFAULT_SHOW_VALUES }
			ref={ overlayRef }
		>
			<div data-testid="box" style={ { height: 300, width: 300 } } />
		</BoxModelOverlay>
	);

	const overlay = screen.getByTestId( 'box-model-overlay' );

	const promise = new Promise( ( resolve ) => {
		const mutationObserver = new window.MutationObserver( resolve );

		mutationObserver.observe( overlay, {
			attributes: true,
			attributeFilter: [ 'style' ],
		} );
	} );

	overlayRef.current.update();

	const entries = await promise;

	expect( entries[ 0 ].attributeName ).toBe( 'style' );
} );

it( 'should react to style changes', async () => {
	render(
		<BoxModelOverlay
			data-testid="box-model-overlay"
			showValues={ DEFAULT_SHOW_VALUES }
		>
			<div data-testid="box" style={ { height: 300, width: 300 } } />
		</BoxModelOverlay>
	);

	const box = screen.getByTestId( 'box' );
	const overlay = screen.getByTestId( 'box-model-overlay' );

	const promise = new Promise( ( resolve ) => {
		const mutationObserver = new window.MutationObserver( resolve );

		mutationObserver.observe( overlay, {
			attributes: true,
			attributeFilter: [ 'style' ],
		} );
	} );

	box.style.padding = '20px';

	const entries = await promise;

	expect( entries[ 0 ].attributeName ).toBe( 'style' );
} );

it( 'renders the overlay to where Popover.Slot is', async () => {
	render(
		<SlotFillProvider>
			<BoxModelOverlay
				data-testid="box-model-overlay"
				showValues={ DEFAULT_SHOW_VALUES }
			>
				<div data-testid="box" style={ { height: 300, width: 300 } } />
			</BoxModelOverlay>

			<div data-testid="slot">
				{ /* @ts-ignore-error: The type for Popover is wrong here. */ }
				<Popover.Slot />
			</div>
		</SlotFillProvider>
	);

	const box = screen.getByTestId( 'box' );
	const overlay = screen.getByTestId( 'box-model-overlay' );
	const slot = screen.getByTestId( 'slot' );

	expect( overlay ).toBeVisible();

	expect( slot.contains( overlay ) ).toBe( true );
	expect( slot.contains( box ) ).toBe( false );
} );

it( 'should correctly unmount the component', async () => {
	const { unmount } = render(
		<BoxModelOverlay
			data-testid="box-model-overlay"
			showValues={ DEFAULT_SHOW_VALUES }
		>
			<div data-testid="box" style={ { height: 300, width: 300 } } />
		</BoxModelOverlay>
	);

	unmount();
} );
