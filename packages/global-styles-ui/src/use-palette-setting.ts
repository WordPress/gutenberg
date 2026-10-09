import { useContext, useRef } from '@wordpress/element';
import { getSetting, setSetting } from '@wordpress/global-styles-engine';
import { GlobalStylesContext } from './context';
import { useSetting } from './hooks';

/**
 * Edits a palette live while preserving its user override for cancellation.
 *
 * @param path      The palette setting path.
 * @param blockName The block name, if editing a block palette.
 */
export function usePaletteSetting< T >( path: string, blockName?: string ) {
	const [ value, setValue ] = useSetting< T >( path, blockName );
	const { user, onChange } = useContext( GlobalStylesContext );
	const originalValueRef = useRef< T | undefined >( undefined );

	const onChangeStart = () => {
		// Read only this scope's override. `getSetting` normally falls back to
		// global settings for blocks, which would create a block override on cancel.
		const scope = blockName
			? { settings: user.settings?.blocks?.[ blockName ] }
			: user;
		originalValueRef.current = getSetting< T >( scope, path );
	};
	const onChangeCancel = () => {
		// Restore this palette in the latest config so unrelated edits survive.
		const restoredConfig = setSetting(
			user,
			path,
			originalValueRef.current,
			blockName
		);
		if ( originalValueRef.current === undefined ) {
			// `setSetting` clones the path but leaves an undefined leaf, which
			// masks the base palette during merging. Remove it and empty parents.
			const settingPath = [
				'settings',
				...( blockName ? [ 'blocks', blockName ] : [] ),
				...path.split( '.' ),
			];
			let current = restoredConfig as Record< string, unknown >;
			const parents: { value: Record< string, unknown >; key: string }[] =
				[];
			for ( const key of settingPath ) {
				parents.push( { value: current, key } );
				current = current[ key ] as Record< string, unknown >;
			}
			for ( const { value: parent, key } of parents.reverse() ) {
				delete parent[ key ];
				if ( Object.keys( parent ).length ) {
					break;
				}
			}
		}
		onChange( restoredConfig );
	};

	return [ value, setValue, { onChangeStart, onChangeCancel } ] as const;
}
