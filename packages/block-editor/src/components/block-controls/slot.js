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
import { useBlockEditingMode } from '../block-editing-mode';

const { ComponentsContext } = unlock( privateApis );

export default function BlockControlsSlot( { group = 'default', ...props } ) {
	const toolbarState = useContext( ToolbarContext );
	const contextState = useContext( ComponentsContext );

	// Get the block editing mode for the current block
	const blockEditingMode = useBlockEditingMode();

	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[ ToolbarContext.Provider, { value: toolbarState } ],
				[ ComponentsContext.Provider, { value: contextState } ],
			],
			shouldRender: ( element ) => {
				// In content-only mode, only render elements with category="content"
				if ( blockEditingMode === 'contentOnly' ) {
					return element?.props?.category === 'content';
				}
				// In other modes, render all elements
				return true;
			},
		} ),
		[ toolbarState, contextState, blockEditingMode ]
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
