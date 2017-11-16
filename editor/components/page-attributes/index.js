/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PageAttributesCheck from './check';
import { editPost } from '../../state/actions';
import { getEditedPostAttribute } from '../../state/selectors';

export function PageAttributes( { onUpdateOrder, instanceId, order } ) {
	const setUpdatedOrder = ( event ) => {
		const newOrder = Number( event.target.value );
		if ( newOrder >= 0 ) {
			onUpdateOrder( newOrder );
		}
	};
	// Create unique identifier for inputs
	const inputId = `editor-page-attributes__order-${ instanceId }`;

	return (
		<PageAttributesCheck>
			<label htmlFor={ inputId }>
				{ __( 'Order' ) }
			</label>,
			<input
				type="text"
				value={ order || 0 }
				onChange={ setUpdatedOrder }
				id={ inputId }
				size={ 6 }
			/>,
		</PageAttributesCheck>
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

export default flowRight( [
	applyConnect,
	withInstanceId,
] )( PageAttributes );
