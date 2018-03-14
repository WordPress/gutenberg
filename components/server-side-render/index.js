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
			response: {},
			attributes: props,
		};
	}

	componentDidMount() {
		this.getOutput();
	}

	componentWillReceiveProps( nextProps ) {
		if ( JSON.stringify( nextProps ) !== JSON.stringify( this.props ) ) {
			this.setState( { attributes: nextProps }, this.getOutput );
		}
	}

	getOutput() {
		this.setState( { response: {} } );
		const { block } = this.props;
		const attributes = this.state.attributes;
		const apiURL = addQueryArgs( '/gutenberg/v1/block-renderer/' + block, {
			...attributes,
			_wpnonce: wpApiSettings.nonce,
		} );

		return wp.apiRequest( { path: apiURL } ).then( response => {
			if ( response && response.output ) {
				this.setState( { response: response.output } );
			}
		} );
	}

	render() {
		const response = this.state.response;
		if ( ! response.length ) {
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
