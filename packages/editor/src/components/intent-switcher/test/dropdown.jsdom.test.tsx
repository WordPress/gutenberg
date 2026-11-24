import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import IntentDropdown from '../dropdown';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		useViewportMatch: vi.fn( () => true ),
	} as unknown as typeof original;
} );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		useSelect: vi.fn(),
		useDispatch: vi.fn( () => ( {} ) ),
	} as unknown as typeof original;
} );

// The real store module registers private actions through `unlock`, which
// the identity mock below cannot do.
vi.mock(
	import( '../../../store' ),
	() => ( { store: {} } ) as unknown as typeof import( '../../../store' )
);

vi.mock( import( '../../../lock-unlock' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		unlock: ( value: unknown ) => value,
	} as unknown as typeof original;
} );

vi.mock(
	import( '../../post-type-support-check' ),
	async ( importOriginal ) => {
		const original = await importOriginal();

		return {
			...original,
			default: ( { children }: { children: ReactNode } ) => children,
		} as unknown as typeof original;
	}
);

// One state object serves the button's and the radio group's `useSelect`.
function mockState( {
	intent = 'edit',
	showIconLabels = false,
	isWideViewport = true,
} = {} ) {
	vi.mocked( useSelect ).mockReturnValue( {
		intent,
		isSuggesting: intent === 'suggest',
		isRichEditingEnabled: true,
		showIconLabels,
	} );
	vi.mocked( useViewportMatch ).mockReturnValue( isWideViewport );
}

describe( 'IntentDropdown', () => {
	beforeEach( () => mockState() );

	it( 'names the active mode on the button', () => {
		render( <IntentDropdown /> );

		const button = screen.getByRole( 'button', { name: 'Mode: Editing' } );
		expect( button ).toHaveTextContent( 'Editing' );
		expect( button ).not.toHaveClass( 'is-suggesting' );
	} );

	it( 'follows the intent', () => {
		mockState( { intent: 'suggest' } );
		render( <IntentDropdown /> );

		const button = screen.getByRole( 'button', {
			name: 'Mode: Suggesting',
		} );
		expect( button ).toHaveTextContent( 'Suggesting' );
		expect( button ).toHaveClass( 'is-suggesting' );
	} );

	it( 'collapses to the icon on a narrow viewport', () => {
		mockState( { isWideViewport: false } );
		render( <IntentDropdown /> );

		const button = screen.getByRole( 'button', { name: 'Mode: Editing' } );
		expect( button ).toHaveTextContent( '' );
		expect( button ).toHaveClass( 'has-icon' );
	} );

	it( 'keeps the text and drops the icon when text labels are on', () => {
		mockState( { showIconLabels: true, isWideViewport: false } );
		render( <IntentDropdown /> );

		const button = screen.getByRole( 'button', { name: 'Mode: Editing' } );
		expect( button ).toHaveTextContent( 'Editing' );
		expect( button ).not.toHaveClass( 'has-icon' );
	} );

	it( 'opens the mode choices', async () => {
		const user = userEvent.setup();
		render( <IntentDropdown /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Mode: Editing' } )
		);

		expect(
			await screen.findByRole( 'menuitemradio', { name: /Editing/ } )
		).toBeChecked();
		expect(
			screen.getByRole( 'menuitemradio', { name: /Suggesting/ } )
		).not.toBeChecked();
	} );
} );
