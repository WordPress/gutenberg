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
import useDisplayBlockToolbarContents from '../use-display-block-controls';

const { Fill, Slot } = createSlotFill( 'BlockToolbarContents' );

function BlockToolbarContentsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState } />;
}

function BlockToolbarContentsFill( { controls, children } ) {
	if ( ! useDisplayBlockToolbarContents() ) {
		return null;
	}

	return (
		<Fill>
			{ ( fillProps ) => {
				// Children passed to BlockToolbarContentsFill will not have access to any
				// React Context whose Provider is part of the BlockToolbarContentsSlot tree.
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

const BlockToolbarContents = BlockToolbarContentsFill;

BlockToolbarContents.Slot = BlockToolbarContentsSlot;

export default BlockToolbarContents;
