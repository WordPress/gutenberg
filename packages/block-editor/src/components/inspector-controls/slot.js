/**
 * WordPress dependencies
 */
import { __experimentalUseSlot as useSlot } from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import BlockSupportToolsPanel from './block-support-tools-panel';
import BlockSupportSlotContainer from './block-support-slot-container';
import groups from './groups';

export default function InspectorControlsSlot( {
	__experimentalGroup: group = 'default',
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
		return (
			<BlockSupportToolsPanel group={ group } label={ label }>
				<BlockSupportSlotContainer { ...props } Slot={ Slot } />
			</BlockSupportToolsPanel>
		);
	}

	return <Slot { ...props } bubblesVirtually />;
}
