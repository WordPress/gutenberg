/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Flex,
	FlexBlock,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';

export const PageAttributesOrder = ( { onUpdateOrder, order = 0 } ) => {
	const [ orderInput, setOrderInput ] = useState( null );

	const setUpdatedOrder = ( value ) => {
		setOrderInput( value );
		const newOrder = Number( value );
		if ( Number.isInteger( newOrder ) && value.trim?.() !== '' ) {
			onUpdateOrder( Number( value ) );
		}
	};
	const value = orderInput === null ? order : orderInput;
	return (
		<Flex>
			<FlexBlock>
				<NumberControl
					label={ __( 'Order' ) }
					value={ value }
					onChange={ setUpdatedOrder }
					labelPosition="side"
					onBlur={ () => {
						setOrderInput( null );
					} }
				/>
			</FlexBlock>
		</Flex>
	);
};

function PageAttributesOrderWithChecks( props ) {
	return (
		<PostTypeSupportCheck supportKeys="page-attributes">
			<PageAttributesOrder { ...props } />
		</PostTypeSupportCheck>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			order: select( editorStore ).getEditedPostAttribute( 'menu_order' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateOrder( order ) {
			dispatch( editorStore ).editPost( {
				menu_order: order,
			} );
		},
	} ) ),
] )( PageAttributesOrderWithChecks );
