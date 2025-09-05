/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
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
	fillProps,
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

	return <Slot { ...props } fillProps={ fillProps } bubblesVirtually />;
}
