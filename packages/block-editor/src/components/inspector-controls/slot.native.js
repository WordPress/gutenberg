/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';

export default function InspectorControlsSlot( {
	__experimentalGroup: group = 'default',
	...props
} ) {
	const Slot = groups[ group ]?.Slot;
	if ( ! Slot ) {
		warning( `Unknown InspectorControl group "${ group }" provided.` );
		return null;
	}

	return <Slot { ...props } />;
}
