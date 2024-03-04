/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';

export function useHasAnyBlockControls() {
	let hasAnyBlockControls = false;
	for ( const group in groups ) {
		// It is safe to violate the rules of hooks here as the `groups` object
		// is static and will not change length between renders. Do not return
		// early as that will cause the hook to be called a different number of
		// times between renders.
		// eslint-disable-next-line react-hooks/rules-of-hooks
		if ( useHasBlockControls( group ) ) {
			hasAnyBlockControls = true;
		}
	}
	return hasAnyBlockControls;
}

export function useHasBlockControls( group = 'default' ) {
	const Slot = groups[ group ]?.Slot;
	const fills = useSlotFills( Slot?.__unstableName );
	if ( ! Slot ) {
		warning( `Unknown BlockControls group "${ group }" provided.` );
		return null;
	}
	return !! fills?.length;
}
