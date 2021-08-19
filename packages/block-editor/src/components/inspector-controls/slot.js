/**
 * WordPress dependencies
 */
import { __experimentalUseSlot as useSlot } from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';

export default function InspectorControlsSlot( {
	__experimentalGroup: group = 'default',
	bubblesVirtually = true,
	...props
} ) {
	const Slot = groups[ group ]?.Slot;
	const slot = useSlot( Slot?.__unstableName );
	if ( ! Slot || ! slot ) {
		warning( `Unknown InspectorControl group "${ group }" provided.` );
		return null;
	}

	const hasFills = Boolean( slot.fills && slot.fills.length );
	if ( ! hasFills ) {
		return null;
	}

	return <Slot { ...props } bubblesVirtually={ bubblesVirtually } />;
}
