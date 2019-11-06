/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { createSlotFill, ToolbarGroup, ToolbarContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockControls' );

function BlockControlsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState || null } />;
}

function BlockControlsFill( { controls, children } ) {
	return (
		<Fill>
			{ ( fillProps ) => (
				<ToolbarContext.Provider value={ fillProps }>
					<ToolbarGroup controls={ controls } />
					{ children }
				</ToolbarContext.Provider>
			) }
		</Fill>
	);
}

const BlockControls = ifBlockEditSelected( BlockControlsFill );

BlockControls.Slot = BlockControlsSlot;

export default BlockControls;
