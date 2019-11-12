/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { createSlotFill, ToolbarGroup, __experimentalToolbarContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockControls' );

function BlockControlsSlot( props ) {
	const accessibleToolbarState = useContext( __experimentalToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState || null } />;
}

function BlockControlsFill( { controls, children } ) {
	return (
		<Fill>
			{ ( fillProps ) => (
				<__experimentalToolbarContext.Provider value={ fillProps }>
					<ToolbarGroup controls={ controls } />
					{ children }
				</__experimentalToolbarContext.Provider>
			) }
		</Fill>
	);
}

const BlockControls = ifBlockEditSelected( BlockControlsFill );

BlockControls.Slot = BlockControlsSlot;

export default BlockControls;
