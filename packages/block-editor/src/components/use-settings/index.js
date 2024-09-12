/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Hook that retrieves the given settings for the block instance in use.
 *
 * It looks up the settings first in the block instance hierarchy.
 * If none are found, it'll look them up in the block editor settings.
 *
 * @param {string[]} paths The paths to the settings.
 * @return {any[]} Returns the values defined for the settings.
 * @example
 * ```js
 * const [ fixed, sticky ] = useSettings( 'position.fixed', 'position.sticky' );
 * ```
 */
export function useSettings( ...paths ) {
	const { clientId = null } = useBlockEditContext();
	return useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getBlockSettings(
				clientId,
				...paths
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ clientId, ...paths ]
	);
}

/**
 * Hook that retrieves the given setting for the block instance in use.
 *
 * It looks up the setting first in the block instance hierarchy.
 * If none is found, it'll look it up in the block editor settings.
 *
 * @deprecated 6.5.0 Use useSettings instead.
 *
 * @param {string} path The path to the setting.
 * @return {any} Returns the value defined for the setting.
 * @example
 * ```js
 * const isEnabled = useSetting( 'typography.dropCap' );
 * ```
 */
export function useSetting( path ) {
	deprecated( 'wp.blockEditor.useSetting', {
		since: '6.5',
		alternative: 'wp.blockEditor.useSettings',
		note: 'The new useSettings function can retrieve multiple settings at once, with better performance.',
	} );

	const [ value ] = useSettings( path );
	return value;
}
