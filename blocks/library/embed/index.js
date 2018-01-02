/**
 * External dependencies
 */
import { parse } from 'url';
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component, renderToString } from '@wordpress/element';
import { Button, Placeholder, Spinner, SandBox } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import { registerBlockType, createBlock } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

// These embeds do not work in sandboxes
const HOSTS_NO_PREVIEWS = [ 'facebook.com' ];

function getEmbedBlockSettings( { title, icon, category = 'embed', transforms, keywords = [] } ) {
	return {
		title,

		description: __( 'The Embed block allows you to easily add videos, images, tweets, audio, and other content to your post or page.' ),

		icon,

		category,

		keywords,

		attributes: {
			url: {
				type: 'string',
			},
			caption: {
				type: 'array',
				source: 'children',
				selector: 'figcaption',
				default: [],
			},
			align: {
				type: 'string',
			},
		},

		transforms,

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
				// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
				// acually the full size photo.
				const photoPreview = <p><img src={ photo.thumbnail_url } alt={ photo.title } width="100%" /></p>;
				return renderToString( photoPreview );
			}

			doServerSideRender( event ) {
				if ( event ) {
					event.preventDefault();
				}
				const { url } = this.props.attributes;
				const apiURL = addQueryArgs( wpApiSettings.root + 'oembed/1.0/proxy', {
					url: url,
					_wpnonce: wpApiSettings.nonce,
				} );

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

				const controls = focus && (
					<BlockControls key="controls">
						<BlockAlignmentToolbar
							value={ align }
							onChange={ updateAlignment }
						/>
					</BlockControls>
				);

				if ( fetching ) {
					return [
						controls,
						<div key="loading" className="wp-block-embed is-loading">
							<Spinner />
							<p>{ __( 'Embedding…' ) }</p>
						</div>,
					];
				}

				if ( ! html ) {
					const label = sprintf( __( '%s URL' ), title );

					return [
						controls,
						<Placeholder key="placeholder" icon={ icon } label={ label } className="wp-block-embed">
							<form onSubmit={ this.doServerSideRender }>
								<input
									type="url"
									value={ url || '' }
									className="components-placeholder__input"
									aria-label={ label }
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
				const iframeTitle = sprintf( __( 'Embedded content from %s' ), parsedUrl.host );
				let typeClassName = 'wp-block-embed';
				if ( 'video' === type ) {
					typeClassName += ' is-video';
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
							<div className="wp-block-embed__wrapper">
								<SandBox html={ html } title={ iframeTitle } type={ type } />
							</div>
						) }
						{ ( caption && caption.length > 0 ) || !! focus ? (
							<Editable
								tagName="figcaption"
								placeholder={ __( 'Write caption…' ) }
								value={ caption }
								focus={ focus }
								onFocus={ setFocus }
								onChange={ ( value ) => setAttributes( { caption: value } ) }
								inlineToolbar
							/>
						) : null }
					</figure>,
				];
			}
		},

		save( { attributes } ) {
			const { url, caption, align } = attributes;

			if ( ! url ) {
				return;
			}

			return (
				<figure className={ align ? `align${ align }` : null }>
					{ `\n${ url }\n` /* URL needs to be on its own line. */ }
					{ caption && caption.length > 0 && <figcaption>{ caption }</figcaption> }
				</figure>
			);
		},
	};
}

registerBlockType(
	'core/embed',
	getEmbedBlockSettings( {
		title: __( 'Embed' ),
		icon: 'embed-generic',
		transforms: {
			from: [
				{
					type: 'raw',
					isMatch: ( node ) => node.nodeName === 'P' && /^\s*(https?:\/\/\S+)\s*/i.test( node.textContent ),
					transform: ( node ) => {
						return createBlock( 'core/embed', {
							url: node.textContent.trim(),
						} );
					},
				},
			],
		},
	} )
);

// Common
registerBlockType(
	'core-embed/twitter',
	getEmbedBlockSettings( {
		title: 'Twitter',
		icon: 'embed-post',
		keywords: [ __( 'tweet' ) ],
	} )
);
registerBlockType(
	'core-embed/youtube',
	getEmbedBlockSettings( {
		title: 'YouTube',
		icon: 'embed-video',
		keywords: [ __( 'music' ), __( 'video' ) ],
	} )
);
registerBlockType(
	'core-embed/facebook',
	getEmbedBlockSettings( {
		title: 'Facebook',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/instagram',
	getEmbedBlockSettings( {
		title: 'Instagram',
		icon: 'embed-photo',
		keywords: [ __( 'image' ) ],
	} )
);
registerBlockType(
	'core-embed/wordpress',
	getEmbedBlockSettings( {
		title: 'WordPress',
		icon: 'embed-post',
		keywords: [ __( 'post' ), __( 'blog' ) ],
	} )
);
registerBlockType(
	'core-embed/soundcloud',
	getEmbedBlockSettings( {
		title: 'SoundCloud',
		icon: 'embed-audio',
		keywords: [ __( 'music' ), __( 'audio' ) ],
	} )
);
registerBlockType(
	'core-embed/spotify',
	getEmbedBlockSettings( {
		title: 'Spotify',
		icon: 'embed-audio',
		keywords: [ __( 'music' ), __( 'audio' ) ],
	} )
);
registerBlockType(
	'core-embed/flickr',
	getEmbedBlockSettings( {
		title: 'Flickr',
		icon: 'embed-photo',
		keywords: [ __( 'image' ) ],
	} )
);
registerBlockType(
	'core-embed/vimeo',
	getEmbedBlockSettings( {
		title: 'Vimeo',
		icon: 'embed-video',
		keywords: [ __( 'video' ) ],
	} )
);

// Others
registerBlockType(
	'core-embed/animoto',
	getEmbedBlockSettings( {
		title: 'Animoto',
		icon: 'embed-video',
	} )
);
registerBlockType(
	'core-embed/cloudup',
	getEmbedBlockSettings( {
		title: 'Cloudup',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/collegehumor',
	getEmbedBlockSettings( {
		title: 'CollegeHumor',
		icon: 'embed-video',
	} )
);
registerBlockType(
	'core-embed/dailymotion',
	getEmbedBlockSettings( {
		title: 'Dailymotion',
		icon: 'embed-video',
	} )
);
registerBlockType(
	'core-embed/funnyordie',
	getEmbedBlockSettings( {
		title: 'Funny or Die',
		icon: 'embed-video',
	} ) );
registerBlockType(
	'core-embed/hulu',
	getEmbedBlockSettings( {
		title: 'Hulu',
		icon: 'embed-video',
	} )
);
registerBlockType(
	'core-embed/imgur',
	getEmbedBlockSettings( {
		title: 'Imgur',
		icon: 'embed-photo',
	} )
);
registerBlockType(
	'core-embed/issuu',
	getEmbedBlockSettings( {
		title: 'Issuu',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/kickstarter',
	getEmbedBlockSettings( {
		title: 'Kickstarter',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/meetup-com',
	getEmbedBlockSettings( {
		title: 'Meetup.com',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/mixcloud',
	getEmbedBlockSettings( {
		title: 'Mixcloud',
		icon: 'embed-audio',
		keywords: [ __( 'music' ), __( 'audio' ) ],
	} )
);
registerBlockType(
	'core-embed/photobucket',
	getEmbedBlockSettings( {
		title: 'Photobucket',
		icon: 'embed-photo',
	} )
);
registerBlockType(
	'core-embed/polldaddy',
	getEmbedBlockSettings( {
		title: 'Polldaddy',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/reddit',
	getEmbedBlockSettings( {
		title: 'Reddit',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/reverbnation',
	getEmbedBlockSettings( {
		title: 'ReverbNation',
		icon: 'embed-audio',
	} )
);
registerBlockType(
	'core-embed/screencast',
	getEmbedBlockSettings( {
		title: 'Screencast',
		icon: 'embed-video',
	} )
);
registerBlockType(
	'core-embed/scribd',
	getEmbedBlockSettings( {
		title: 'Scribd',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/slideshare',
	getEmbedBlockSettings( {
		title: 'Slideshare',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/smugmug',
	getEmbedBlockSettings( {
		title: 'SmugMug',
		icon: 'embed-photo',
	} )
);
registerBlockType(
	'core-embed/speaker',
	getEmbedBlockSettings( {
		title: 'Speaker',
		icon: 'embed-audio',
	} )
);
registerBlockType(
	'core-embed/ted',
	getEmbedBlockSettings( {
		title: 'TED',
		icon: 'embed-video',
	} )
);
registerBlockType(
	'core-embed/tumblr',
	getEmbedBlockSettings( {
		title: 'Tumblr',
		icon: 'embed-post',
	} )
);
registerBlockType(
	'core-embed/videopress',
	getEmbedBlockSettings( {
		title: 'VideoPress',
		icon: 'embed-video',
		keywords: [ __( 'video' ) ],
	} )
);
registerBlockType(
	'core-embed/vine',
	getEmbedBlockSettings( {
		title: 'Vine',
		icon: 'embed-video',
	} )
);
registerBlockType(
	'core-embed/wordpress-tv',
	getEmbedBlockSettings( {
		title: 'WordPress.tv',
		icon: 'embed-video',
	} )
);
