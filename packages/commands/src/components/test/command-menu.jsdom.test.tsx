import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import { plus } from '@wordpress/icons';
import { store as commandsStore } from '../../store';
import { CommandMenu } from '../command-menu';
import type { CommandConfig } from '../../store/types';

globalThis.wpVitest.mockResizeObserver();

const NAME = 'test/command';

function openWithIcon( icon: unknown, category?: CommandConfig[ 'category' ] ) {
	act( () => {
		dispatch( commandsStore ).registerCommand( {
			name: NAME,
			label: 'Test command',
			icon,
			category,
			callback: () => {},
		} as CommandConfig );
		dispatch( commandsStore ).open();
	} );
	render( <CommandMenu /> );
	fireEvent.change( screen.getByRole( 'combobox' ), {
		target: { value: 'Test' },
	} );
	// The icon is decorative, so there is no role to query it by.
	const item = screen
		.getByRole( 'option', { name: /^Test command/ } )
		// eslint-disable-next-line testing-library/no-node-access
		.querySelector( '.commands-command-menu__item' );
	return {
		hasIconClass: !! item?.classList.contains( 'has-icon' ),
		icon: item?.querySelector( 'svg, .dashicon' ),
	};
}

describe( 'CommandMenu', () => {
	beforeAll( () => {
		// cmdk scrolls the selected item into view, which jsdom lacks.
		Element.prototype.scrollIntoView = () => {};
	} );

	afterEach( () => {
		act( () => {
			dispatch( commandsStore ).unregisterCommand( NAME );
			dispatch( commandsStore ).close();
		} );
	} );

	it( 'renders an element icon', () => {
		const { hasIconClass, icon } = openWithIcon( plus );

		expect( hasIconClass ).toBe( true );
		expect( icon?.tagName ).toBe( 'svg' );
	} );

	it( 'renders a dashicon name', () => {
		const { hasIconClass, icon } = openWithIcon( 'admin-site' );

		expect( hasIconClass ).toBe( true );
		expect( icon?.classList.contains( 'dashicons-admin-site' ) ).toBe(
			true
		);
	} );

	it( 'falls back to the category icon for an invalid value', () => {
		const { hasIconClass, icon } = openWithIcon( false, 'view' );

		expect( hasIconClass ).toBe( true );
		expect( icon?.tagName ).toBe( 'svg' );
	} );

	it( 'renders no icon for an invalid value without a category icon', () => {
		const { hasIconClass, icon } = openWithIcon( false );

		expect( hasIconClass ).toBe( false );
		expect( icon ).toBeFalsy();
	} );
} );
