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

const getSlotName = ( clientId ) => `BlockNavigationEllipsisMenu-${ clientId }`;
const { Fill, Slot } = createSlotFill( 'EllipsisMenu' );

const EllipsisMenuControlsSlot = ( { fillProps, clientId } ) => (
	<Slot name={ getSlotName( clientId ) } fillProps={ fillProps }>
		{ ( fills ) => ! isEmpty( fills ) && <>{ fills }</> }
	</Slot>
);

export const EllipsisMenuControls = ( props ) => {
	const { clientId } = useContext( BlockListBlockContext );
	return <Fill { ...props } name={ getSlotName( clientId ) } />;
};

EllipsisMenuControls.Slot = EllipsisMenuControlsSlot;

export default EllipsisMenuControls;
