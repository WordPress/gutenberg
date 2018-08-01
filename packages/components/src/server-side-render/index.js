/**
 * External dependencies.
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies.
 */
import {
	Component,
	RawHTML,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies.
 */
import Placeholder from '../placeholder';
import Spinner from '../spinner';

export function rendererPathWithAttributes( block, attributes = null ) {
	return addQueryArgs( `/gutenberg/v1/block-renderer/${ block }`, {
		context: 'edit',
		...( null !== attributes ? { attributes } : {} ),
	} );
}

export class ServerSideRender extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			response: null,
		};
	}

	componentDidMount() {
		this.isStillMounted = true;
		this.fetch( this.props );
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	componentDidUpdate( prevProps ) {
		if ( ! isEqual( prevProps, this.props ) ) {
			this.fetch( this.props );
		}
	}

	fetch( props ) {
		if ( null !== this.state.response ) {
			this.setState( { response: null } );
		}
		const { block, attributes = null } = props;

		const path = rendererPathWithAttributes( block, attributes );

		return apiFetch( { path } )
			.then( ( response ) => {
				if ( this.isStillMounted && response && response.rendered ) {
					this.setState( { response: response.rendered } );
				}
			} )
			.catch( ( error ) => {
				if ( this.isStillMounted ) {
					this.setState( { response: {
						error: true,
						errorMsg: error.message,
					} } );
				}
			} );
	}

	render() {
		const response = this.state.response;
		if ( ! response ) {
			return (
				<Placeholder><Spinner /></Placeholder>
			);
		} else if ( response.error ) {
			// translators: %s: error message describing the problem
			const errorMessage = sprintf( __( 'Error loading block: %s' ), response.errorMsg );
			return (
				<Placeholder>{ errorMessage }</Placeholder>
			);
		} else if ( ! response.length ) {
			return (
				<Placeholder>{ __( 'No results found.' ) }</Placeholder>
			);
		}

		return (
			<RawHTML key="html">{ response }</RawHTML>
		);
	}
}

export default ServerSideRender;
