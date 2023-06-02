/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
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
	const accessibleToolbarState = useContext( ToolbarContext );
	const Slot = groups[ group ]?.Slot;
	if ( ! Slot ) {
		warning( `Unknown BlockControls group "${ group }" provided.` );
		return null;
	}

	if ( group === 'default' ) {
		return <Slot { ...props } fillProps={ accessibleToolbarState } />;
	}

	return (
		<Slot { ...props } fillProps={ accessibleToolbarState }>
			{ ( fills ) => {
				if ( ! fills.length ) {
					return null;
				}
				return <ToolbarGroup>{ fills }</ToolbarGroup>;
			} }
		</Slot>
	);
}
