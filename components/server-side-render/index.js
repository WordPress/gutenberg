/**
 * External dependencies.
 */
import { isEqual, isPlainObject, map } from 'lodash';

/**
 * WordPress dependencies.
 */
import {
	Component,
	RawHTML,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies.
 */
import Placeholder from '../placeholder';
import Spinner from '../spinner';

export class ServerSideRender extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			response: null,
		};
	}

	componentWillMount() {
		this.isStillMounted = true;
	}

	componentDidMount() {
		this.fetch( this.props );
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( nextProps, this.props ) ) {
			this.fetch( nextProps );
		}
	}

	fetch( props ) {
		if ( null !== this.state.response ) {
			this.setState( { response: null } );
		}
		const { block, attributes } = props;

		const path = '/gutenberg/v1/block-renderer/' + block + '?context=edit&' + this.getQueryUrlFromObject( { attributes } );

		return apiRequest( { path: path } ).then( ( response ) => {
			if ( this.isStillMounted && response && response.rendered ) {
				this.setState( { response: response.rendered } );
			}
		} );
	}

	getQueryUrlFromObject( obj, prefix ) {
		return map( obj, ( paramValue, paramName ) => {
			const key = prefix ? prefix + '[' + paramName + ']' : paramName;
			return isPlainObject( paramValue ) ? this.getQueryUrlFromObject( paramValue, key ) :
				encodeURIComponent( key ) + '=' + encodeURIComponent( paramValue );
		} ).join( '&' );
	}

	render() {
		const response = this.state.response;
		if ( ! response ) {
			return (
				<Placeholder><Spinner /></Placeholder>
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
