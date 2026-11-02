import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommandLoader } from '@wordpress/commands';
import { useSelect } from '@wordpress/data';
import { useSiteEditorNavigationCommands } from '../site-editor-navigation-commands';

vi.mock( import( '@wordpress/commands' ), () => ( {
	useCommandLoader: vi.fn(),
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '../lock-unlock' ), () => ( {
	lock: ( value ) => value,
	unlock: () => ( {
		useHistory: () => ( { navigate: vi.fn() } ),
	} ),
} ) );

const templateRecord = {
	id: 1,
	title: { rendered: 'Template' },
};

function mockStore( { isBlockTheme, canCreateTemplate, records } ) {
	useSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getCurrentTheme: () => ( { is_block_theme: isBlockTheme } ),
			canUser: () => canCreateTemplate,
			getEntityRecords: () => records,
			hasFinishedResolution: () => true,
		} ) )
	);
}

function getTemplateCommandLoader( name ) {
	const loaders = [];
	useCommandLoader.mockImplementation( ( loader ) => {
		loaders.push( loader );
	} );

	renderHook( () => useSiteEditorNavigationCommands( false ) );

	return loaders.find( ( loader ) => loader.name === name ).hook;
}

describe( 'getNavigationCommandLoaderPerTemplate', () => {
	beforeEach( () => {
		useCommandLoader.mockReset();
		useSelect.mockReset();
	} );

	it( 'filters out template commands for classic themes', () => {
		mockStore( {
			isBlockTheme: false,
			canCreateTemplate: true,
			records: [ templateRecord ],
		} );

		const hook = getTemplateCommandLoader(
			'core/edit-site/navigate-templates'
		);
		const { result } = renderHook( () => hook( { search: '' } ) );

		expect( result.current.commands ).toEqual( [] );
	} );

	it( 'keeps template part commands for classic themes', () => {
		mockStore( {
			isBlockTheme: false,
			canCreateTemplate: true,
			records: [ templateRecord ],
		} );

		const hook = getTemplateCommandLoader(
			'core/edit-site/navigate-template-parts'
		);
		const { result } = renderHook( () => hook( { search: '' } ) );

		expect(
			result.current.commands.map( ( command ) => command.name )
		).toEqual( [
			'wp_template_part-1',
			'core/edit-site/open-template-parts',
		] );
	} );

	it( 'keeps template commands for block themes', () => {
		mockStore( {
			isBlockTheme: true,
			canCreateTemplate: true,
			records: [ templateRecord ],
		} );

		const hook = getTemplateCommandLoader(
			'core/edit-site/navigate-templates'
		);
		const { result } = renderHook( () => hook( { search: '' } ) );

		expect(
			result.current.commands.map( ( command ) => command.name )
		).toEqual( [ 'wp_template-1' ] );
	} );

	it( 'filters out both loaders when the user cannot create templates', () => {
		mockStore( {
			isBlockTheme: true,
			canCreateTemplate: false,
			records: [ templateRecord ],
		} );

		for ( const name of [
			'core/edit-site/navigate-templates',
			'core/edit-site/navigate-template-parts',
		] ) {
			const hook = getTemplateCommandLoader( name );
			const { result } = renderHook( () => hook( { search: '' } ) );

			expect( result.current.commands ).toEqual( [] );
		}
	} );
} );
