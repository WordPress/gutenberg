/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { PanelBody, PanelRow, withInstanceId } from '@wordpress/components';

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

	componentDidMount() {
		this.fetchSupports();
	}

	fetchSupports() {
		const { postTypeSlug } = this.props;
		this.fetchSupportsRequest = new wp.api.models.Type( { id: postTypeSlug } )
			.fetch( { data: { context: 'edit' } } )
			.done( ( postType ) => {
				const {
					'page-attributes': supportsPageAttributes = false,
				} = postType.supports;

				this.setState( { supportsPageAttributes } );
			} );
	}

	componentWillUnmount() {
		if ( this.fetchSupportsRequest ) {
			this.fetchSupportsRequest.abort();
		}
	}

	setUpdatedOrder( event ) {
		const order = Number( event.target.value );
		if ( order >= 0 ) {
			this.props.onUpdateOrder( order );
		}
	}

	render() {
		const { instanceId, order } = this.props;
		const { supportsPageAttributes } = this.state;

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

export default connect(
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
)( withInstanceId( PageAttributes ) );
