/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlotFills as useSlotFills,
	__unstableMotionContext as MotionContext,
} from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';
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
	const Slot = groups[ group ]?.Slot;
	const fills = useSlotFills( Slot?.__unstableName );

	const motionContextValue = useContext( MotionContext );

	const computedFillProps = useMemo(
		() => ( {
			...( fillProps ?? {} ),
			forwardedContext: [
				...( fillProps?.forwardedContext ?? [] ),
				[ MotionContext.Provider, { value: motionContextValue } ],
			],
		} ),
		[ motionContextValue, fillProps ]
	);

	if ( ! Slot ) {
		warning( `Unknown InspectorControls group "${ group }" provided.` );
		return null;
	}

	if ( ! fills?.length ) {
		return null;
	}

	if ( label ) {
		return (
			<BlockSupportToolsPanel group={ group } label={ label }>
				<BlockSupportSlotContainer
					{ ...props }
					fillProps={ computedFillProps }
					Slot={ Slot }
				/>
			</BlockSupportToolsPanel>
		);
	}

	return (
		<Slot { ...props } fillProps={ computedFillProps } bubblesVirtually />
	);
}
