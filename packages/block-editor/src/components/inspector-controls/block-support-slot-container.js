/**
 * WordPress dependencies
 */
import { __experimentalToolsPanelContext as ToolsPanelContext } from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';

export default function BlockSupportSlotContainer( {
	Slot,
	fillProps,
	...props
} ) {
	// Add the toolspanel context provider and value to existing fill props
	const toolsPanelContext = useContext( ToolsPanelContext );
	const computedFillProps = useMemo(
		() => ( {
			...( fillProps ?? {} ),
			forwardedContext: [
				...( fillProps?.forwardedContext ?? [] ),
				[ ToolsPanelContext.Provider, { value: toolsPanelContext } ],
			],
		} ),
		[ toolsPanelContext, fillProps ]
	);

	return (
		<Slot { ...props } fillProps={ computedFillProps } bubblesVirtually />
	);
}
