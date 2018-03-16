/**
 * External dependencies.
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Component,
	RawHTML,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

export class ServerSideRender extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			response: null,
		};
	}

	componentDidMount() {
		this.fetch();
	}

	componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( nextProps, this.props ) ) {
			this.fetch();
		}
	}

	fetch() {
		this.setState( { response: null } );
		const { block } = this.props;
		const apiURL = addQueryArgs( '/gutenberg/v1/block-renderer/' + block, {
			...this.props,
			_wpnonce: wpApiSettings.nonce,
		} );

		return wp.apiRequest( { path: apiURL } ).then( response => {
			if ( response && response.rendered ) {
				this.setState( { response: response.rendered } );
			}
		} );
	}

	render() {
		const response = this.state.response;
		if ( ! response || ! response.length ) {
			return (
				<div key="loading" className="wp-block-embed is-loading">

					<p>{ __( 'Loading...' ) }</p>
				</div>
			);
		}

		return (
			<RawHTML key="html">{ response }</RawHTML>
		);
	}
}

export default ServerSideRender;
