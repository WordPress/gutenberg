/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'EllipsisMenu' );

const EllipsisMenuControlsSlot = ( { fillProps } ) => {
	return (
		<Slot fillProps={ { ...fillProps } }>
			{ ( fills ) => ! isEmpty( fills ) && <>{ fills }</> }
		</Slot>
	);
};

const EllipsisMenuControls = ifBlockEditSelected( Fill );

EllipsisMenuControls.Slot = EllipsisMenuControlsSlot;

export default EllipsisMenuControls;
