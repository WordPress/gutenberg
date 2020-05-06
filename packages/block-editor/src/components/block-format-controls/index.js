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
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockFormatControls' );

function BlockFormatControlsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState } />;
}

function BlockFormatControlsFill( props ) {
	return (
		<Fill>
			{ ( fillProps ) => {
				const value = ! isEmpty( fillProps ) ? fillProps : null;
				return (
					<ToolbarContext.Provider value={ value }>
						{ props.children }
					</ToolbarContext.Provider>
				);
			} }
		</Fill>
	);
}

const BlockFormatControls = ifBlockEditSelected( BlockFormatControlsFill );

BlockFormatControls.Slot = BlockFormatControlsSlot;

export default BlockFormatControls;
