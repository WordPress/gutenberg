/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import {
	__experimentalToolbarContext as ToolbarContext,
	ToolbarGroup,
} from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';

export default function BlockControlsSlot( { group = 'default', ...props } ) {
	const toolbarState = useContext( ToolbarContext );
	const fillProps = useMemo(
		() => [ [ ToolbarContext.Provider, { value: toolbarState } ] ],
		[ toolbarState ]
	);

	const Slot = groups[ group ]?.Slot;
	if ( ! Slot ) {
		warning( `Unknown BlockControls group "${ group }" provided.` );
		return null;
	}

	if ( group === 'default' ) {
		return <Slot { ...props } fillProps={ fillProps } />;
	}

	return (
		<Slot { ...props } fillProps={ fillProps }>
			{ ( fills ) => {
				if ( ! fills.length ) {
					return null;
				}
				return <ToolbarGroup>{ fills }</ToolbarGroup>;
			} }
		</Slot>
	);
}
