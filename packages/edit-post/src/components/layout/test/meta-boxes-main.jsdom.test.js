import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from '@wordpress/element';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { MetaBoxesMain } from '../index';
import { store as editPostStore } from '../../../store';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '../../meta-boxes' ), () => ( {
	default: ( { location } ) =>
		createElement( 'div', { 'data-testid': `meta-boxes-${ location }` } ),
} ) );

function renderWithVisibility( visibleLocations ) {
	const registry = createRegistry( {
		[ preferencesStore.name ]: {
			reducer: ( state = {} ) => state,
			selectors: { get: () => true },
			actions: { set: () => ( { type: 'SET' } ) },
		},
		[ editPostStore.name ]: {
			reducer: ( state = {} ) => state,
			selectors: {
				isMetaBoxLocationVisible: ( state, location ) =>
					visibleLocations.includes( location ),
			},
		},
	} );

	return render(
		createElement(
			RegistryProvider,
			{ value: registry },
			createElement( MetaBoxesMain )
		)
	);
}

describe( 'MetaBoxesMain', () => {
	beforeAll( () => {
		window.ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	} );

	it( 'renders nothing when there are no visible meta boxes', () => {
		const { container } = renderWithVisibility( [] );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when only side meta boxes are visible', () => {
		const { container } = renderWithVisibility( [ 'side' ] );

		expect( container ).toBeEmptyDOMElement();
		expect(
			screen.queryByRole( 'button', { name: 'Meta Boxes' } )
		).not.toBeInTheDocument();
	} );

	it.each( [ [ 'normal' ], [ 'advanced' ] ] )(
		'renders the pane when %s meta boxes are visible',
		( location ) => {
			renderWithVisibility( [ location ] );

			expect(
				screen.getByRole( 'button', { name: 'Meta Boxes' } )
			).toBeVisible();
		}
	);

	it( 'renders the pane when normal and side meta boxes are visible', () => {
		renderWithVisibility( [ 'normal', 'side' ] );

		expect(
			screen.getByRole( 'button', { name: 'Meta Boxes' } )
		).toBeVisible();
	} );
} );
