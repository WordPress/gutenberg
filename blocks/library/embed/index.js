/**
 * External dependencies
 */
import { parse } from 'url';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from 'i18n';
import { Component } from 'element';
import { Button, Placeholder, HtmlEmbed, Spinner } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const { attr, children } = query;

const HOSTS_NO_PREVIEWS = [ 'facebook.com' ];

function getEmbedBlockSettings( { title, icon, category = 'embed' } ) {
	return {
		title: __( title ),

		icon,

		category,

		attributes: {
			title: attr( 'iframe', 'title' ),
			caption: children( 'figcaption' ),
		},

		getEditWrapperProps( attributes ) {
			const { align } = attributes;
			if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
				return { 'data-align': align };
			}
		},

		edit: class extends Component {
			constructor() {
				super( ...arguments );
				this.doServerSideRender = this.doServerSideRender.bind( this );
				this.state = {
					html: '',
					type: '',
					error: false,
					fetching: false,
				};
			}

			componentWillMount() {
				if ( this.props.attributes.url ) {
					// if the url is already there, we're loading a saved block, so we need to render
					// a different thing, which is why this doesn't use 'fetching', as that
					// is for when the user is putting in a new url on the placeholder form
					this.setState( { fetching: true } );
					this.doServerSideRender();
				}
			}

			componentWillUnmount() {
				// can't abort the fetch promise, so let it know we will unmount
				this.unmounting = true;
			}

			getPhotoHtml( photo ) {
				const photoPreview = <p><img src={ photo.thumbnail_url } alt={ photo.title } /></p>;
				return wp.element.renderToString( photoPreview );
			}

			doServerSideRender( event ) {
				if ( event ) {
					event.preventDefault();
				}
				const { url } = this.props.attributes;
				const apiURL = wpApiSettings.root + 'oembed/1.0/proxy?url=' + encodeURIComponent( url ) + '&_wpnonce=' + wpApiSettings.nonce;

				this.setState( { error: false, fetching: true } );
				window.fetch( apiURL, {
					credentials: 'include',
				} ).then(
					( response ) => {
						if ( this.unmounting ) {
							return;
						}
						response.json().then( ( obj ) => {
							const { html, type } = obj;
							if ( html ) {
								this.setState( { html, type } );
							} else if ( 'photo' === type ) {
								this.setState( { html: this.getPhotoHtml( obj ), type } );
							} else {
								this.setState( { error: true } );
							}
							this.setState( { fetching: false } );
						} );
					}
				);
			}

			render() {
				const { html, type, error, fetching } = this.state;
				const { align, url, caption } = this.props.attributes;
				const { setAttributes, focus, setFocus } = this.props;
				const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );

				const controls = (
					focus && (
						<BlockControls key="controls">
							<BlockAlignmentToolbar
								value={ align }
								onChange={ updateAlignment }
								controls={ [ 'left', 'center', 'right', 'wide', 'full' ] }
							/>
						</BlockControls>
					)
				);

				if ( fetching ) {
					return [
						controls,
						<div key="loading" className="blocks-embed is-loading">
							<Spinner />
							<p>{ __( 'Embedding…' ) }</p>
						</div>,
					];
				}

				if ( ! html ) {
					return [
						controls,
						<Placeholder key="placeholder" icon={ icon } label={ sprintf( __( '%s URL' ), title ) } className="blocks-embed">
							<form onSubmit={ this.doServerSideRender }>
								<input
									type="url"
									value={ url || '' }
									className="components-placeholder__input"
									placeholder={ __( 'Enter URL to embed here…' ) }
									onChange={ ( event ) => setAttributes( { url: event.target.value } ) } />
								<Button
									isLarge
									type="submit">
									{ __( 'Embed' ) }
								</Button>
								{ error && <p className="components-placeholder__error">{ __( 'Sorry, we could not embed that content.' ) }</p> }
							</form>
						</Placeholder>,
					];
				}

				const parsedUrl = parse( url );
				const cannotPreview = includes( HOSTS_NO_PREVIEWS, parsedUrl.host.replace( /^www\./, '' ) );
				let typeClassName = 'blocks-embed';

				if ( 'video' === type ) {
					typeClassName = 'blocks-embed-video';
				}

				return [
					controls,
					<figure key="embed" className={ typeClassName }>
						{ ( cannotPreview ) ? (
							<Placeholder icon={ icon } label={ __( 'Embed URL' ) }>
								<p className="components-placeholder__error"><a href={ url }>{ url }</a></p>
								<p className="components-placeholder__error">{ __( 'Previews for this are unavailable in the editor, sorry!' ) }</p>
							</Placeholder>
						) : (
							<HtmlEmbed html={ html } />
						) }
						{ ( caption && caption.length > 0 ) || !! focus ? (
							<Editable
								tagName="figcaption"
								placeholder={ __( 'Write caption…' ) }
								value={ caption }
								focus={ focus }
								onFocus={ setFocus }
								onChange={ ( value ) => setAttributes( { caption: value } ) }
								inline
								inlineToolbar
							/>
						) : null }
					</figure>,
				];
			}
		},

		save( { attributes } ) {
			const { url, caption } = attributes;
			if ( ! caption || ! caption.length ) {
				return url;
			}

			return (
				<figure>{ '\n' }
					{ url }
					<figcaption>{ caption }</figcaption>
				</figure>
			);
		},
	};
}

registerBlockType( 'core/embed', getEmbedBlockSettings( { title: 'Embed', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedanimoto', getEmbedBlockSettings( { title: 'Animoto', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedcloudup', getEmbedBlockSettings( { title: 'Cloudup', icon: 'cloud' } ) );
registerBlockType( 'core/embedcollegehumor', getEmbedBlockSettings( { title: 'CollegeHumor', icon: 'video-alt3' } ) );
registerBlockType( 'core/embeddailymotion', getEmbedBlockSettings( { title: 'Dailymotion', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedfacebook', getEmbedBlockSettings( { title: 'Facebook', icon: 'facebook' } ) );
registerBlockType( 'core/embedflickr', getEmbedBlockSettings( { title: 'Flickr', icon: 'format-image' } ) );
registerBlockType( 'core/embedfunnyordie', getEmbedBlockSettings( { title: 'Funny or Die', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedhulu', getEmbedBlockSettings( { title: 'Hulu', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedimgur', getEmbedBlockSettings( { title: 'Imgur', icon: 'format-image' } ) );
registerBlockType( 'core/embedinstagram', getEmbedBlockSettings( { title: 'Instagram', icon: 'camera' } ) );
registerBlockType( 'core/embedissuu', getEmbedBlockSettings( { title: 'Issuu', icon: 'media-default' } ) );
registerBlockType( 'core/embedkickstarter', getEmbedBlockSettings( { title: 'Kickstarter', icon: 'lightbulb' } ) );
registerBlockType( 'core/embedmeetupcom', getEmbedBlockSettings( { title: 'Meetup.com', icon: 'location-alt' } ) );
registerBlockType( 'core/embedmixcloud', getEmbedBlockSettings( { title: 'Mixcloud', icon: 'format-audio' } ) );
registerBlockType( 'core/embedphotobucket', getEmbedBlockSettings( { title: 'Photobucket', icon: 'camera' } ) );
registerBlockType( 'core/embedpolldaddy', getEmbedBlockSettings( { title: 'Polldaddy', icon: 'yes' } ) );
registerBlockType( 'core/embedreddit', getEmbedBlockSettings( { title: 'Reddit', icon: 'share' } ) );
registerBlockType( 'core/embedreverbnation', getEmbedBlockSettings( { title: 'ReverbNation', icon: 'format-audio' } ) );
registerBlockType( 'core/embedscreencast', getEmbedBlockSettings( { title: 'Screencast', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedscribd', getEmbedBlockSettings( { title: 'Scribd', icon: 'book-alt' } ) );
registerBlockType( 'core/embedslideshare', getEmbedBlockSettings( { title: 'Slideshare', icon: 'slides' } ) );
registerBlockType( 'core/embedsmugmug', getEmbedBlockSettings( { title: 'SmugMug', icon: 'camera' } ) );
registerBlockType( 'core/embedsoundcloud', getEmbedBlockSettings( { title: 'SoundCloud', icon: 'format-audio' } ) );
registerBlockType( 'core/embedspeaker', getEmbedBlockSettings( { title: 'Speaker', icon: 'format-audio' } ) );
registerBlockType( 'core/embedspotify', getEmbedBlockSettings( { title: 'Spotify', icon: 'format-audio' } ) );
registerBlockType( 'core/embedted', getEmbedBlockSettings( { title: 'TED', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedtumblr', getEmbedBlockSettings( { title: 'Tumblr', icon: 'share' } ) );
registerBlockType( 'core/embedtwitter', getEmbedBlockSettings( { title: 'Twitter', icon: 'twitter' } ) );
registerBlockType( 'core/embedvideopress', getEmbedBlockSettings( { title: 'VideoPress', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedvimeo', getEmbedBlockSettings( { title: 'Vimeo', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedvine', getEmbedBlockSettings( { title: 'Vine', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedwordpress', getEmbedBlockSettings( { title: 'WordPress', icon: 'wordpress' } ) );
registerBlockType( 'core/embedwordpresstv', getEmbedBlockSettings( { title: 'WordPress.tv', icon: 'video-alt3' } ) );
registerBlockType( 'core/embedyoutube', getEmbedBlockSettings( { title: 'YouTube', icon: 'video-alt3' } ) );
