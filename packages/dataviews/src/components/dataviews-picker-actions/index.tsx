/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Action } from '../../types';

export function useIsMultiselectPicker< Item >( actions: Action< Item >[] ) {
	return useMemo( () => {
		return actions.every( ( action ) => action.supportsBulk );
	}, [ actions ] );
}
