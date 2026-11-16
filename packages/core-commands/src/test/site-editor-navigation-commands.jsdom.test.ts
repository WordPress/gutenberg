import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommandLoader } from '@wordpress/commands';
import { createRegistry, useSelect } from '@wordpress/data';
import { useSiteEditorNavigationCommands } from '../site-editor-navigation-commands';

vi.mock( import( '@wordpress/commands' ), () => ( {
	useCommandLoader: vi.fn(),
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

const selectors = {
	getCurrentTheme: vi.fn( () => ( { is_block_theme: false } ) ),
	canUser: vi.fn( () => true ),
	getEntityRecords: vi.fn( ( _kind: string, name: string ) => [
		{
			id: name === 'wp_template' ? 'theme//index' : 'theme//header',
			title: { raw: 'Example', rendered: 'Example' },
		},
	] ),
	hasFinishedResolution: vi.fn( () => true ),
};

function renderTemplateCommands( type: 'templates' | 'template-parts' ) {
	renderHook( () => useSiteEditorNavigationCommands() );
	const loader = vi
		.mocked( useCommandLoader )
		.mock.calls.find(
			( [ config ]: [ { name: string } ] ) =>
				config.name === `core/edit-site/navigate-${ type }`
		)?.[ 0 ];

	if ( ! loader ) {
		throw new Error( `Missing ${ type } command loader` );
	}

	return renderHook( () => loader.hook( { search: '' } ) ).result.current;
}

describe( 'template navigation commands', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		selectors.getCurrentTheme.mockReturnValue( { is_block_theme: false } );
		selectors.canUser.mockReturnValue( true );
		const registry = createRegistry();
		const select = vi.fn().mockReturnValue( selectors );
		vi.mocked( useSelect ).mockImplementation( ( mapSelect ) => {
			if ( typeof mapSelect !== 'function' ) {
				throw new Error( 'Expected a selector callback' );
			}
			return mapSelect( select, registry );
		} );
	} );

	it( 'hides template commands on classic themes', () => {
		expect( renderTemplateCommands( 'templates' )?.commands ).toEqual( [] );
	} );

	it( 'keeps permitted template parts available on classic themes', () => {
		const commands = renderTemplateCommands( 'template-parts' )?.commands;
		expect(
			commands?.map( ( command: { name: string } ) => command.name )
		).toEqual( [
			'wp_template_part-theme//header',
			'core/edit-site/open-template-parts',
		] );
	} );

	it.each( [ 'templates', 'template-parts' ] as const )(
		'keeps permitted %s available on block themes',
		( type ) => {
			selectors.getCurrentTheme.mockReturnValue( {
				is_block_theme: true,
			} );
			const expectedNames =
				type === 'templates'
					? [ 'wp_template-theme//index' ]
					: [
							'wp_template_part-theme//header',
							'core/edit-site/open-template-parts',
						];
			expect(
				renderTemplateCommands( type )?.commands?.map(
					( command: { name: string } ) => command.name
				)
			).toEqual( expectedNames );
		}
	);

	it.each( [
		[ 'templates', 'classic', false ],
		[ 'template-parts', 'classic', false ],
		[ 'templates', 'block', true ],
		[ 'template-parts', 'block', true ],
	] as const )(
		'hides %s without permission on a %s theme',
		( type, _theme, isBlockBasedTheme ) => {
			selectors.getCurrentTheme.mockReturnValue( {
				is_block_theme: isBlockBasedTheme,
			} );
			selectors.canUser.mockReturnValue( false );
			expect( renderTemplateCommands( type )?.commands ).toEqual( [] );
		}
	);
} );
