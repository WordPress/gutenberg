/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BlockListBlockContext } from '../block-list/block';

const getSlotName = ( clientId ) => `BlockNavigationItemSettings-${ clientId }`;
const { Fill, Slot } = createSlotFill( 'ItemSettings' );

const ItemSettingsControlsSlot = ( { fillProps, clientId } ) => (
	<Slot name={ getSlotName( clientId ) } fillProps={ fillProps }>
		{ ( fills ) => ! isEmpty( fills ) && <>{ fills }</> }
	</Slot>
);

export const ItemSettingsControls = ( props ) => {
	const { clientId } = useContext( BlockListBlockContext );
	return <Fill { ...props } name={ getSlotName( clientId ) } />;
};

ItemSettingsControls.Slot = ItemSettingsControlsSlot;

export default ItemSettingsControls;
