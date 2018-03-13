/**
 * WordPress dependencies
 */
import {
	Component,
	compose,
	RawHTML
} from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

export class ServerSideRender extends Component {

	constructor( props ) {
		super( props );
		this.state = {
			response: {},
			attributes: props.attributes,
		};
	}

	componentDidMount() {
		this.getOutput();
	}

	componentWillReceiveProps( nextProps ) {
		if ( JSON.stringify( nextProps.attributes ) !== JSON.stringify( this.props.attributes ) ) {
			this.setState( { attributes: nextProps.attributes }, this.getOutput );
		}
	}

	getOutput() {
		this.setState( { response: {} } );
		const { block } = this.props;
		const attributes = this.state.attributes;
		const apiURL = addQueryArgs( wpApiSettings.root + 'gutenberg/v1/blocks-renderer/' + block, { ...attributes } );
		return window.fetch( apiURL, {
			credentials: 'include',
			_wpnonce: wpApiSettings.nonce,
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