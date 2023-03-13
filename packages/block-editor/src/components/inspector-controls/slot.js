/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlot as useSlot,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import warning from '@wordpress/warning';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import BlockSupportToolsPanel from './block-support-tools-panel';
import BlockSupportSlotContainer from './block-support-slot-container';
import groups from './groups';

export default function InspectorControlsSlot( {
	__experimentalGroup,
	group = 'default',
	label,
	...props
} ) {
	if ( __experimentalGroup ) {
		deprecated(
			'`__experimentalGroup` property in `InspectorControlsSlot`',
			{
				since: '6.2',
				version: '6.4',
				alternative: '`group`',
			}
		);
		group = __experimentalGroup;
	}
	const Slot = groups[ group ]?.Slot;
	const slot = useSlot( Slot?.__unstableName );
	const fills = useSlotFills( Slot?.__unstableName );
	if ( ! Slot || ! slot ) {
		warning( `Unknown InspectorControl group "${ group }" provided.` );
		return null;
	}

	const hasFills = Boolean( fills && fills.length );
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
