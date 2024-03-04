/**
 * WordPress dependencies
 */
import { ToolbarGroup } from '@wordpress/components';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import groups from './groups';

export default function BlockControlsSlot( { group = 'default', ...props } ) {
	const Slot = groups[ group ]?.Slot;
	if ( ! Slot ) {
		warning( `Unknown BlockControls group "${ group }" provided.` );
		return null;
	}

	if ( group === 'default' ) {
		return <Slot { ...props } />;
	}

	return (
		<Slot { ...props }>
			{ ( fills ) => {
				if ( ! fills.length ) {
					return null;
				}
				return <ToolbarGroup>{ fills }</ToolbarGroup>;
			} }
		</Slot>
	);
}
