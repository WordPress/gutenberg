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

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockControls' );

function BlockControlsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState } />;
}

function BlockControlsFill( { controls, children } ) {
	const { isSelected } = useBlockEditContext();
	if ( ! isSelected ) {
		return null;
	}

	return (
		<Fill>
			{ ( fillProps ) => {
				// Children passed to BlockControlsFill will not have access to any
				// React Context whose Provider is part of the BlockControlsSlot tree.
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

const BlockControls = BlockControlsFill;

BlockControls.Slot = BlockControlsSlot;

export default BlockControls;
