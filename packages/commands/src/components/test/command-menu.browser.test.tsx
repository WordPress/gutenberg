import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { dispatch } from '@wordpress/data';
import { plus } from '@wordpress/icons';
import { store as commandsStore } from '../../store';
import { CommandMenu } from '../command-menu';
import type { CommandConfig } from '../../store/types';

const NAME = 'test/command';

async function openWithIcon(
	icon: unknown,
	category?: CommandConfig[ 'category' ]
) {
	dispatch( commandsStore ).registerCommand( {
		name: NAME,
		label: 'Test command',
		icon,
		category,
		callback: () => {},
	} as CommandConfig );
	dispatch( commandsStore ).open();
	await render( <CommandMenu /> );
	await userEvent.fill( page.getByRole( 'combobox' ), 'Test' );

	// The icon is decorative, so there is no role to query it by.
	const item = page
		.getByRole( 'option', { name: /^Test command/ } )
		.element()
		.querySelector( '.commands-command-menu__item' );
	return {
		hasIconClass: !! item?.classList.contains( 'has-icon' ),
		icon: item?.querySelector( 'svg, .dashicon' ),
	};
}

describe( 'CommandMenu', () => {
	afterEach( () => {
		dispatch( commandsStore ).unregisterCommand( NAME );
		dispatch( commandsStore ).close();
	} );

	it( 'renders an element icon', async () => {
		const { hasIconClass, icon } = await openWithIcon( plus );

		expect( hasIconClass ).toBe( true );
		expect( icon?.tagName ).toBe( 'svg' );
	} );

	it( 'renders a dashicon name at the same size as an element icon', async () => {
		const { hasIconClass, icon } = await openWithIcon( 'admin-site' );

		expect( hasIconClass ).toBe( true );
		expect( icon?.classList.contains( 'dashicons-admin-site' ) ).toBe(
			true
		);
		expect( icon?.getBoundingClientRect().width ).toBe( 24 );
	} );

	it.each( [ false, '' ] )(
		'falls back to the category icon for %j',
		async ( value ) => {
			const { hasIconClass, icon } = await openWithIcon( value, 'view' );

			expect( hasIconClass ).toBe( true );
			expect( icon?.tagName ).toBe( 'svg' );
		}
	);

	it( 'renders no icon for an invalid value without a category icon', async () => {
		const { hasIconClass, icon } = await openWithIcon( false );

		expect( hasIconClass ).toBe( false );
		expect( icon ).toBeFalsy();
	} );
} );
