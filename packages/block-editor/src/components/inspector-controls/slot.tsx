import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import type { ForwardedRef } from 'react';
import BlockSupportToolsPanel from './block-support-tools-panel';
import BlockSupportSlotContainer from './block-support-slot-container';
import groups from './groups';
import type { InspectorControlsSlotProps } from './types';

function InspectorControlsSlot(
	{
		group = 'default',
		label,
		fillProps,
		...props
	}: InspectorControlsSlotProps,
	ref: ForwardedRef< unknown >
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
