/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalToolbarContext as ToolbarContext,
	ToolbarGroup,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import groups from './groups';

export default function BlockControlsSlot( { group = 'default', ...props } ) {
	const { Slot, useSlot } = groups[ group ];
	const accessibleToolbarState = useContext( ToolbarContext );
	const slot = useSlot();
	const hasFills = Boolean( slot.fills && slot.fills.length );
	if ( ! hasFills ) {
		return null;
	}

	if ( group === 'default' ) {
		return (
			<Slot
				{ ...props }
				bubblesVirtually
				fillProps={ accessibleToolbarState }
			/>
		);
	}

	return (
		<ToolbarGroup>
			<Slot
				{ ...props }
				bubblesVirtually
				fillProps={ accessibleToolbarState }
			/>
		</ToolbarGroup>
	);
}
