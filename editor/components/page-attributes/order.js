/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/components';
import { compose, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { editPost } from '../../store/actions';
import { getEditedPostAttribute } from '../../store/selectors';

export function PageAttributesOrder( { onUpdateOrder, instanceId, order } ) {
	const setUpdatedOrder = ( event ) => {
		const newOrder = Number( event.target.value );
		if ( newOrder >= 0 ) {
			onUpdateOrder( newOrder );
		}
	};
	// Create unique identifier for inputs
	const inputId = `editor-page-attributes__order-${ instanceId }`;

	return (
		<Fragment>
			<label htmlFor={ inputId }>
				{ __( 'Order' ) }
			</label>
			<input
				type="text"
				value={ order || 0 }
				onChange={ setUpdatedOrder }
				id={ inputId }
				size={ 6 }
			/>
		</Fragment>
	);
}

function PageAttributesOrderWithChecks( props ) {
	return (
		<PostTypeSupportCheck supportKeys="page-attributes">
			<PageAttributesOrder { ...props } />
		</PostTypeSupportCheck>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			order: getEditedPostAttribute( state, 'menu_order' ),
		};
	},
	{
		onUpdateOrder( order ) {
			return editPost( {
				menu_order: order,
			} );
		},
	}
);

export default compose( [
	applyConnect,
	withInstanceId,
] )( PageAttributesOrderWithChecks );
