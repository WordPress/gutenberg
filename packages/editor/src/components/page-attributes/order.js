/**
 * External dependencies
 */
import { invoke } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, withState } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

export const PageAttributesOrder = withState( {
	orderInput: null,
} )(
	( { onUpdateOrder, order = 0, orderInput, setState } ) => {
		const setUpdatedOrder = ( value ) => {
			setState( {
				orderInput: value,
			} );
			const newOrder = Number( value );
			if ( Number.isInteger( newOrder ) && invoke( value, [ 'trim' ] ) !== '' ) {
				onUpdateOrder( Number( value ) );
			}
		};
		const value = orderInput === null ? order : orderInput;
		return (
			<TextControl
				className="editor-page-attributes__order"
				type="number"
				label={ __( 'Order' ) }
				value={ value }
				onChange={ setUpdatedOrder }
				size={ 6 }
				onBlur={ () => {
					setState( {
						orderInput: null,
					} );
				} }
			/>
		);
	}
);

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
			order: select( 'core/editor' ).getEditedPostAttribute( 'menu_order' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateOrder( order ) {
			dispatch( 'core/editor' ).editPost( {
				menu_order: order,
			} );
		},
	} ) ),
] )( PageAttributesOrderWithChecks );
