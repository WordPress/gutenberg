import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import BlockSupportToolsPanel from './block-support-tools-panel';
import BlockSupportSlotContainer from './block-support-slot-container';
import groups from './groups';

function InspectorControlsSlot(
	{ group = 'default', label, fillProps, ...props },
	ref
) {
	const slotFill = groups[ group ];
	const fills = useSlotFills( slotFill?.name );

	if ( ! slotFill ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}

	if ( ! fills?.length ) {
		return null;
	}

	const { Slot } = slotFill;

	if ( label ) {
		return (
			<BlockSupportToolsPanel group={ group } label={ label }>
				<BlockSupportSlotContainer
					{ ...props }
					fillProps={ fillProps }
					Slot={ Slot }
				/>
			</BlockSupportToolsPanel>
		);
	}

	return (
		<Slot
			{ ...props }
			ref={ ref }
			fillProps={ fillProps }
			bubblesVirtually
		/>
	);
}

export default forwardRef( InspectorControlsSlot );
