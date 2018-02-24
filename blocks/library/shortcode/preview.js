/**
 * External dependencies
 */
import { Component } from 'react';

/**
 * WordPress dependencies
 */
import { Spinner, SandBox } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

class ShortcodePreview extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			shortcode: '',
			response: {},
		};
	}

	componentDidMount() {
		const { shortcode } = this.props;
		const apiURL = addQueryArgs( wpApiSettings.root + 'gutenberg/v1/shortcodes', {
			shortcode: shortcode,
			_wpnonce: wpApiSettings.nonce,
			postId: window._wpGutenbergPost.id,
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
					<Spinner />
					<p>{ __( 'Loading...' ) }</p>
				</div>
			);
		}

		/*
		 * order must match rest controller style is wp_head, html is shortcode, js is footer
		 * should really be named better
		 */
		const html = response.data.style + ' ' + response.data.html + ' ' + response.data.js;
		return (
			<figure className="wp-block-embed" key="embed">
				<div className="wp-block-embed__wrapper">
					<SandBox
						html={ html }
						title="Preview"
						type={ response.data.type }
					/>
				</div>
			</figure>
		);
	}
}

export default ShortcodePreview;
