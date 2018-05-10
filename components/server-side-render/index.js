/**
 * External dependencies.
 */
import { isEqual, isObject, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Component,
	RawHTML,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export class ServerSideRender extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			response: null,
		};
	}

	componentDidMount() {
		this.fetch( this.props );
	}

	componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( nextProps, this.props ) ) {
			this.fetch( nextProps );
		}
	}

	fetch( props ) {
		this.setState( { response: null } );
		const { block, attributes } = props;

		const path = '/gutenberg/v1/block-renderer/' + block + '?context=edit&' + this.getQueryUrlFromObject( { attributes } );

		return wp.apiRequest( { path: path } ).then( ( response ) => {
			if ( response && response.rendered ) {
				this.setState( { response: response.rendered } );
			}
		} );
	}

	getQueryUrlFromObject( obj, prefix ) {
		return map( obj, ( paramValue, paramName ) => {
			const key = prefix ? prefix + '[' + paramName + ']' : paramName,
				value = obj[ paramName ];
			return isObject( paramValue ) ? this.getQueryUrlFromObject( value, key ) :
				encodeURIComponent( key ) + '=' + encodeURIComponent( value );
		} ).join( '&' );
	}

	render() {
		const response = this.state.response;
		if ( ! response || ! response.length ) {
			return (
				<div key="loading" className="wp-block-embed is-loading">

					<p>{ __( 'Loading…' ) }</p>
				</div>
			);
		}

		return (
			<RawHTML key="html">{ response }</RawHTML>
		);
	}
}

export default ServerSideRender;
