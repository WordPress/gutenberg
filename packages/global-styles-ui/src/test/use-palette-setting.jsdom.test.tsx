import { act, renderHook } from '@testing-library/react';
import { useContext, useState } from '@wordpress/element';
import {
	getSetting,
	mergeGlobalStyles,
	setSetting,
} from '@wordpress/global-styles-engine';
import type {
	Color,
	GlobalStylesConfig,
} from '@wordpress/global-styles-engine';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { GlobalStylesContext } from '../context';
import { usePaletteSetting } from '../use-palette-setting';

const path = 'color.palette.theme';
const colors: Color[] = [
	{ name: 'Accent', slug: 'accent', color: '#ffee58' },
];
const editedColors: Color[] = [ { ...colors[ 0 ], color: '#ff0000' } ];
const existingColors: Color[] = [ { ...colors[ 0 ], color: '#0000ff' } ];
const base: GlobalStylesConfig = {
	settings: { color: { palette: { theme: colors } } },
};

function renderPalette( initialUser: GlobalStylesConfig, blockName?: string ) {
	function Wrapper( { children }: { children: ReactNode } ) {
		const [ user, onChange ] = useState( initialUser );
		return (
			<GlobalStylesContext.Provider
				value={ {
					user,
					onChange,
					base,
					merged: mergeGlobalStyles( base, user ),
				} }
			>
				{ children }
			</GlobalStylesContext.Provider>
		);
	}
	return renderHook(
		() => ( {
			palette: usePaletteSetting< Color[] >( path, blockName ),
			context: useContext( GlobalStylesContext ),
		} ),
		{ wrapper: Wrapper }
	);
}

describe( 'usePaletteSetting', () => {
	it.each( [ 'inherited', 'overridden' ] )(
		'restores an %s palette when a picker edit is cancelled',
		( origin ) => {
			const initialUser =
				origin === 'inherited'
					? {}
					: setSetting( {}, path, existingColors );
			const { result } = renderPalette( initialUser );
			act( () => result.current.palette[ 2 ].onChangeStart() );
			act( () => result.current.palette[ 1 ]( editedColors ) );
			expect( result.current.palette[ 0 ] ).toEqual( editedColors );
			act( () => result.current.palette[ 2 ].onChangeCancel() );
			expect( result.current.palette[ 0 ] ).toEqual(
				origin === 'inherited' ? colors : existingColors
			);
			expect( getSetting( result.current.context.user, path ) ).toEqual(
				origin === 'inherited' ? undefined : existingColors
			);
		}
	);

	it( 'retains unrelated edits when cancelling a palette edit', () => {
		const { result } = renderPalette( {} );
		act( () => result.current.palette[ 2 ].onChangeStart() );
		act( () => result.current.palette[ 1 ]( editedColors ) );
		act( () =>
			result.current.context.onChange(
				setSetting(
					result.current.context.user,
					'typography.customFontSize',
					false
				)
			)
		);
		act( () => result.current.palette[ 2 ].onChangeCancel() );
		expect(
			getSetting( result.current.context.user, path )
		).toBeUndefined();
		expect(
			getSetting(
				result.current.context.user,
				'typography.customFontSize'
			)
		).toBe( false );
	} );

	it( 'keeps a block palette inherited from global user settings on cancellation', () => {
		const { result } = renderPalette(
			setSetting( {}, path, existingColors ),
			'core/button'
		);
		act( () => result.current.palette[ 2 ].onChangeStart() );
		act( () => result.current.palette[ 1 ]( editedColors ) );
		act( () => result.current.palette[ 2 ].onChangeCancel() );
		expect( result.current.palette[ 0 ] ).toEqual( existingColors );
		expect(
			getSetting(
				{
					settings:
						result.current.context.user.settings?.blocks?.[
							'core/button'
						],
				},
				path
			)
		).toBeUndefined();
		expect( getSetting( result.current.context.user, path ) ).toEqual(
			existingColors
		);
	} );

	it( 'restores the last accepted value when cancelling a later picker session', () => {
		const { result } = renderPalette( {} );
		act( () => result.current.palette[ 2 ].onChangeStart() );
		act( () => result.current.palette[ 1 ]( editedColors ) );
		act( () => result.current.palette[ 2 ].onChangeStart() );
		act( () => result.current.palette[ 1 ]( existingColors ) );
		act( () => result.current.palette[ 2 ].onChangeCancel() );
		expect( result.current.palette[ 0 ] ).toEqual( editedColors );
	} );
} );
