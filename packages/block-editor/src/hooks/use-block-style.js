/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../components/block-edit/context';
import { store as blockEditorStore } from '../store';
import { getValueFromObjectPath, setImmutably } from '../utils/object';
import { cleanEmptyObject } from './utils';

/**
 * Returns a `[value, setter]` pair for a path within a block's `style`
 * attribute. Works like `useStyle` in Global Styles but reads from the
 * current block instance's attributes instead of `theme.json`.
 *
 * Path uses dot notation into the style object, e.g. `'color'` or
 * `'typography.fontSize'`. Pass a separate `state` argument to scope to a
 * pseudo-state or custom state — the state key becomes the first segment of
 * the storage path:
 *
 *   `useBlockStyle( 'color', ':hover' )`       — `style[':hover'].color`
 *   `useBlockStyle( 'color', '@current' )`     — `style['@current'].color`
 *   `useBlockStyle( 'color', ':hover:focus' )` — compound state
 *
 * Omit `path` (or pass `null`) to read and write the full style object for
 * that state context, e.g. `useBlockStyle( null, ':hover' )` returns the
 * entire `style[':hover']` sub-object.
 *
 * Keeping state separate from the path means no heuristic is needed to
 * distinguish state keys from style property names, regardless of the
 * state format convention used.
 *
 * @param {string|string[]|null} path  Dot-separated path into the `style` object, or `null` for the root.
 * @param {string}               state Optional state key, e.g. `':hover'` or `'@current'`. Omit or pass `'default'` for base styles.
 * @return {[*, Function]} Tuple of `[currentValue, setValue]`.
 */
export function useBlockStyle( path, state ) {
	const { clientId } = useBlockEditContext();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const style = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.style,
		[ clientId ]
	);

	const pathArray = useMemo( () => {
		let stylePath;
		if ( ! path ) {
			stylePath = [];
		} else if ( Array.isArray( path ) ) {
			stylePath = path;
		} else {
			stylePath = path.split( '.' );
		}
		return state && state !== 'default'
			? [ state, ...stylePath ]
			: stylePath;
	}, [ path, state ] );

	const value = useMemo(
		() => getValueFromObjectPath( style, pathArray ),
		[ style, pathArray ]
	);

	const setValue = useCallback(
		( newValue ) => {
			// Empty path means the caller wants to replace the style root (or
			// the full state sub-object) wholesale rather than a nested key.
			const newStyle = pathArray.length
				? setImmutably( style ?? {}, pathArray, newValue )
				: newValue;
			updateBlockAttributes( clientId, {
				style: cleanEmptyObject( newStyle ),
			} );
		},
		[ updateBlockAttributes, clientId, style, pathArray ]
	);

	return [ value, setValue ];
}
