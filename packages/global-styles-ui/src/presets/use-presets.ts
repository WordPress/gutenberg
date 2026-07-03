/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import type { BasePreset } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useSetting } from '../hooks';

const EMPTY_ARRAY: any[] = [];

/**
 * Read + mutate the preset array stored at `${settingsPath}.${origin}`.
 *
 * `presets` is the merged value (via `useSetting`); `basePresets` is the
 * theme/base value, used for reset and comparison.
 *
 * @param settingsPath Origin-keyed base path, e.g. 'shadow.presets'.
 * @param origin       'default' | 'theme' | 'custom'.
 */
export function usePresets< T extends BasePreset >(
	settingsPath: string,
	origin: string
) {
	const path = `${ settingsPath }.${ origin }`;
	const [ presets = EMPTY_ARRAY, setPresets ] = useSetting< T[] >( path );
	const [ basePresets = EMPTY_ARRAY ] = useSetting< T[] >(
		path,
		undefined,
		'base'
	);

	const add = useCallback(
		( preset: T ) => setPresets( [ ...presets, preset ] ),
		[ presets, setPresets ]
	);

	const update = useCallback(
		( slug: string, next: T ) =>
			setPresets(
				presets.map( ( p ) => ( p.slug === slug ? next : p ) )
			),
		[ presets, setPresets ]
	);

	const remove = useCallback(
		( slug: string ) =>
			setPresets( presets.filter( ( p ) => p.slug !== slug ) ),
		[ presets, setPresets ]
	);

	const rename = useCallback(
		( slug: string, name: string ) =>
			setPresets(
				presets.map( ( p ) => ( p.slug === slug ? { ...p, name } : p ) )
			),
		[ presets, setPresets ]
	);

	const removeAll = useCallback( () => setPresets( [] ), [ setPresets ] );

	const resetToBase = useCallback(
		( slug: string ) => {
			const baseItem = basePresets.find( ( p ) => p.slug === slug );
			if ( ! baseItem ) {
				return;
			}
			setPresets(
				presets.map( ( p ) => ( p.slug === slug ? baseItem : p ) )
			);
		},
		[ presets, basePresets, setPresets ]
	);

	return {
		presets,
		basePresets,
		setPresets,
		add,
		update,
		remove,
		rename,
		removeAll,
		resetToBase,
	};
}
