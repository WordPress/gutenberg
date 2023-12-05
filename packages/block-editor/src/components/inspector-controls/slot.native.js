/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';

export default function InspectorControlsSlot( {
	group = 'default',
	...props
} ) {
	const Slot = groups[ group ]?.Slot;
	if ( ! Slot ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}

	return <Slot { ...props } />;
}
