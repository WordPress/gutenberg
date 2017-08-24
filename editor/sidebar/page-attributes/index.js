/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { PanelBody, PanelRow, withAPIData, withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { editPost } from '../../actions';
import { getCurrentPostType, getEditedPostAttribute } from '../../selectors';

export class PageAttributes extends Component {
	constructor() {
		super( ...arguments );

		this.setUpdatedOrder = this.setUpdatedOrder.bind( this );

		this.state = {
			supportsPageAttributes: false,
		};
	}

	setUpdatedOrder( event ) {
		const order = Number( event.target.value );
		if ( order >= 0 ) {
			this.props.onUpdateOrder( order );
		}
	}

	render() {
		const { instanceId, order, postType } = this.props;
		const supportsPageAttributes = get( postType.data, [
			'supports',
			'page-attributes',
		], false );

		// Only render fields if post type supports page attributes
		if ( ! supportsPageAttributes ) {
			return null;
		}

		// Create unique identifier for inputs
		const inputId = `editor-page-attributes__order-${ instanceId }`;

		return (
			<PanelBody
				title={ __( 'Page Attributes' ) }
				initialOpen={ false }
			>
				<PanelRow>
					<label htmlFor={ inputId }>
						{ __( 'Order' ) }
					</label>
					<input
						type="text"
						value={ order || 0 }
						onChange={ this.setUpdatedOrder }
						id={ inputId }
						size={ 6 } />
				</PanelRow>
			</PanelBody>
		);
	}
}

const applyConnect = connect(
	( state ) => {
		return {
			postTypeSlug: getCurrentPostType( state ),
			order: getEditedPostAttribute( state, 'menu_order' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateOrder( order ) {
				dispatch( editPost( {
					menu_order: order,
				} ) );
			},
		};
	}
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postTypeSlug } = props;

	return {
		postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
	};
} );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
	withInstanceId,
] )( PageAttributes );
