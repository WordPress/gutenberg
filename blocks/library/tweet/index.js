/**
 * Internal dependencies
 */
import { registerBlock, query } from '../../api';
import Sandbox from '../../../components/sandbox';
import Button from '../../../components/button';
import Placeholder from '../../../components/placeholder';

const { prop } = query;

registerBlock( 'core/tweet', {
	title: wp.i18n.__( 'Tweet' ),
	icon: 'twitter',

	category: 'social',

	attributes: {
		url: prop( '*', 'innerHTML' ), // our html is just a div with the url in, for WP's oembed to process
	},

	edit: class extends wp.element.Component {
		constructor() {
			super( ...arguments );
			this.fetchTweet = this.fetchTweet.bind( this );
			this.state = {
				url: this.props.attributes.url,
				html: '',
				error: false,
				fetching: false,
			};
			if ( this.state.url ) {
				this.doFetch( this.state.url, this.props.setAttributes, this.setState.bind( this ) );
			}
		}
		doFetch( url, setAttributes, setState ) {
			setState( { fetching: true, error: false } );
			jQuery.ajax( {
				type: 'GET',
				dataType: 'jsonp',
				data: {},
				timeout: 5000,
				url: 'https://publish.twitter.com/oembed?url=' + encodeURI( url ),
				error: function() {
					setState( { fetching: false, error: true } );
				},
				success: function( msg ) {
					setAttributes( { url: url } );
					setState( { fetching: false, error: false, html: msg.html } );
				},
			} );
		}
		fetchTweet() {
			const { url } = this.state;
			this.doFetch( url, this.props.setAttributes, this.setState.bind( this ) );
		}
		render() {
			const { html, url, error, fetching } = this.state;

			if ( ! html ) {
				return (
					<Placeholder icon="twitter" label={ wp.i18n.__( 'Twitter' ) } className="blocks-tweet">
						<input
							type="text"
							className="components-placeholder__input"
							value={ url }
							placeholder={ wp.i18n.__( 'Enter tweet URL to embed...' ) }
							onChange={ ( event ) => this.setState( { url: event.target.value } ) } />
						{ ! fetching ?
							(
								<Button
									isLarge
									onClick={ this.fetchTweet }>
									{ wp.i18n.__( 'Embed' ) }
								</Button>
							) : (
								<span className="spinner is-active" />
							)
						}
						{ error && ( <p className="components-placeholder__error">{ wp.i18n.__( 'Sorry, we couldn\'t fetch that tweet.' ) }</p> ) }
					</Placeholder>
				);
			}
			return (
				<Sandbox html={ html } />
			);
		}
	},

	save( { attributes } ) {
		const { url } = attributes;
		return (
			<div>{ url }</div>
		);
	}
} );
