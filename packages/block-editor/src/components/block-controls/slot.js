/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import {
	privateApis,
	__experimentalToolbarContext as ToolbarContext,
	ToolbarGroup,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';
import { unlock } from '../../lock-unlock';

const { ComponentsContext } = unlock( privateApis );

export default function BlockControlsSlot( { group = 'default', ...props } ) {
	const toolbarState = useContext( ToolbarContext );
	const contextState = useContext( ComponentsContext );
	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[ ToolbarContext.Provider, { value: toolbarState } ],
				[ ComponentsContext.Provider, { value: contextState } ],
			],
		} ),
		[ toolbarState, contextState ]
	);

	const slotFill = groups[ group ];
	const fills = useSlotFills( slotFill.name );

	if ( ! slotFill ) {
		warning( `Unknown BlockControls group "${ group }" provided.` );
		return null;
	}

	if ( ! fills?.length ) {
		return null;
	}

	const { Slot } = slotFill;
	const slot = <Slot { ...props } bubblesVirtually fillProps={ fillProps } />;

	if ( group === 'default' ) {
		return slot;
	}

	return <ToolbarGroup>{ slot }</ToolbarGroup>;
}
