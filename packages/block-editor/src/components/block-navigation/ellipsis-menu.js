/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	__experimentalToolbarContext as ToolbarContext,
	createSlotFill,
	ToolbarGroup,
} from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'EllipsisMenu' );

function EllipsisMenuSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState } />;
}

function EllipsisMenuFill( { controls, children } ) {
	return (
		<Fill>
			{ ( fillProps ) => {
				// Children passed to EllipsisMenuFill will not have access to any
				// React Context whose Provider is part of the EllipsisMenuSlot tree.
				// So we re-create the Provider in this subtree.
				const value = ! isEmpty( fillProps ) ? fillProps : null;
				return (
					<ToolbarContext.Provider value={ value }>
						<ToolbarGroup controls={ controls } />
						{ children }
					</ToolbarContext.Provider>
				);
			} }
		</Fill>
	);
}

const EllipsisMenu = EllipsisMenuFill;

EllipsisMenu.Slot = EllipsisMenuSlot;

export default EllipsisMenu;
