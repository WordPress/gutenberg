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
		const { block } = this.props;
		const attributes = this.state.attributes;
		const apiURL = addQueryArgs( wpApiSettings.root + 'gutenberg/v1/blocks-renderer/' + block, {
			...attributes,
			_wpnonce: wpApiSettings.nonce,
		} );
		return window.fetch( apiURL, {
			credentials: 'include',
		} ).then( response => {
			response.json().then( data => ( {
				data: data,
				status: response.status,
			} ) ).then( res => {
				if ( res.status === 200 ) {
					this.setState( { response: res } );
				}
			} );
		} );
	}

	render() {
		const response = this.state.response;
		if ( response.isLoading || ! response.data ) {
			return (
				<div key="loading" className="wp-block-embed is-loading">

					<p>{ __( 'Loading...' ) }</p>
				</div>
			);
		}

		const html = response.data.output;
		return (
			<RawHTML key="html">{ html }</RawHTML>
		);
	}
}

export default ServerSideRender;
