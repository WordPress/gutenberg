/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlotFills as useSlotFills,
	__unstableMotionContext as MotionContext,
} from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import BlockSupportToolsPanel from './block-support-tools-panel';
import BlockSupportSlotContainer from './block-support-slot-container';
import groups from './groups';

export default function InspectorControlsSlot( {
	group = 'default',
	label,
	fillProps,
	...props
} ) {
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
