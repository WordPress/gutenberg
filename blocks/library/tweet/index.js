/**
 * External dependencies
 */
import jQuery from 'jquery';
/**
 * WordPress dependencies
 */
import Sandbox from 'components/sandbox';
import Button from 'components/button';
import Placeholder from 'components/placeholder';
/**
 * Internal dependencies
 */
import { registerBlock } from '../../api';

registerBlock( 'core/tweet', {
	title: wp.i18n.__( 'Tweet' ),
	icon: 'twitter',

	category: 'social',

	attributes( url ) {
		return { url };
	},

	edit: class extends wp.element.Component {
		constructor() {
			super( ...arguments );
			this.fetchTweet = this.fetchTweet.bind( this );
			// Copies the block's url so we can edit it without having the block
			// update (i.e. refetch the tweet) every time it changes in this edit component.
			this.state = {
				url: this.props.attributes.url,
				html: '',
				error: false,
				fetching: false,
			};
		}
		doFetch( url ) {
			this.setState( { fetching: true, error: false } );
			this.fetchXHR = jQuery.ajax( {
				type: 'GET',
				dataType: 'jsonp',
				timeout: 5000,
				url: 'https://publish.twitter.com/oembed?url=' + encodeURI( url ),
				error: () => this.setState( { fetching: false, error: true } ),
				success: ( msg ) => {
					this.props.setAttributes( { url } );
					this.setState( { fetching: false, error: false, html: msg.html } );
				},
			} );
		}
		componentDidMount() {
			if ( this.state.url ) {
				this.doFetch( this.state.url );
			}
		}
		componentWillUnmount() {
			if ( this.fetchXHR ) {
				this.fetchXHR.abort();
				delete this.fetchXHR;
			}
		}
		fetchTweet( event ) {
			const { url } = this.state;
			event.preventDefault();
			this.doFetch( url );
		}
		render() {
			const { html, url, error, fetching } = this.state;

			if ( html ) {
				const author = this.state.url.split( '/' )[ 3 ];
				/* translators: {AUTHOR}: username of the tweet's author */
				const __title = wp.i18n.__( 'Tweet from {AUTHOR}' );
				const title = __title.replace( '{AUTHOR}', author );
				return (
					<Sandbox
						html={ html }
						title={ title } />
				);
			}

			return (
				<Placeholder icon="twitter" label={ wp.i18n.__( 'Twitter' ) } className="blocks-tweet">
					<form onSubmit={ this.fetchTweet }>
						<input
							className="components-placeholder__input"
							value={ url }
							placeholder={ wp.i18n.__( 'Enter tweet URL to embed...' ) }
							onChange={ ( event ) => this.setState( { url: event.target.value } ) } />
						{ ! fetching ?
							(
								<Button
									isLarge
									type="submit">
									{ wp.i18n.__( 'Embed' ) }
								</Button>
							) : (
								<span className="spinner is-active" />
							)
						}
					</form>
					{ error && ( <p className="components-placeholder__error">{ wp.i18n.__( 'Sorry, we couldn\'t fetch that tweet.' ) }</p> ) }
				</Placeholder>
			);
		}
	},

	save( { attributes } ) {
		const { url } = attributes;
		return url;
	}
} );
