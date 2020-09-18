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
import { useBlockEditContext } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'BlockFormatControls' );

function BlockFormatControlsSlot( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	return <Slot { ...props } fillProps={ accessibleToolbarState } />;
}

function BlockFormatControlsFill( props ) {
	const { isSelected } = useBlockEditContext();
	if ( ! isSelected ) {
		return null;
	}

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

const BlockFormatControls = BlockFormatControlsFill;

BlockFormatControls.Slot = BlockFormatControlsSlot;

export default BlockFormatControls;
