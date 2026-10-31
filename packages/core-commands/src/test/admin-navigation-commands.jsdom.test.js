import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { select } from '@wordpress/data';
import { store as commandsStore } from '@wordpress/commands';
import { useAdminNavigationCommands } from '../admin-navigation-commands';

const getCommand = ( name ) =>
	select( commandsStore )
		.getCommands()
		.find( ( command ) => command.name === name );

describe( 'useAdminNavigationCommands', () => {
	it( 'registers a command for each menu item', () => {
		const { unmount } = renderHook( () =>
			useAdminNavigationCommands( [
				{
					name: 'options-general.php',
					label: 'Settings',
					url: 'options-general.php',
				},
			] )
		);

		expect( getCommand( 'options-general.php' ) ).toMatchObject( {
			label: 'Go to: Settings',
			searchLabel: 'Go to: Settings',
			category: 'view',
		} );

		unmount();
	} );

	it( 'passes the menu item keywords to the command', () => {
		const { unmount } = renderHook( () =>
			useAdminNavigationCommands( [
				{
					name: 'options-general.php-options-general.php',
					label: 'Settings > General',
					url: 'options-general.php',
					keywords: [ 'favicon', 'site icon', 'timezone' ],
				},
			] )
		);

		expect(
			getCommand( 'options-general.php-options-general.php' ).keywords
		).toEqual( [ 'favicon', 'site icon', 'timezone' ] );

		unmount();
	} );

	it( 'leaves keywords undefined when the menu item has none', () => {
		const { unmount } = renderHook( () =>
			useAdminNavigationCommands( [
				{
					name: 'edit.php',
					label: 'Posts',
					url: 'edit.php',
				},
			] )
		);

		expect( getCommand( 'edit.php' ).keywords ).toBeUndefined();

		unmount();
	} );
} );
