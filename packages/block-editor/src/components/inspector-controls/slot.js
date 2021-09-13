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
	label,
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

	if ( label ) {
		// Slots for block support panels will include a label for the panel
		// header. This is passed through the fillProps to indicate when the
		// fills require a wrapping ToolsPanel.
		return (
			<Slot
				{ ...props }
				bubblesVirtually={ bubblesVirtually }
				fillProps={ { label } }
			/>
		);
	}

	return <Slot { ...props } bubblesVirtually={ bubblesVirtually } />;
}
