/**
 * External dependencies
 */
import { parse } from 'url';
import { includes, kebabCase, toLower } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { Component, renderToString } from '@wordpress/element';
import { Button, Placeholder, Spinner, SandBox, IconButton, Toolbar } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { RichText, BlockControls } from '@wordpress/editor';
import { withSelect } from '@wordpress/data';

// These embeds do not work in sandboxes
const HOSTS_NO_PREVIEWS = [ 'facebook.com' ];

const matchesPatterns = ( url, patterns = [] ) => {
	return patterns.some( ( pattern ) => {
		return url.match( pattern );
	} );
};

const findBlock = ( url ) => {
	for ( const block of [ ...common, ...others ] ) {
		if ( matchesPatterns( url, block.patterns ) ) {
			return block.name;
		}
	}
	return 'core/embed';
};

export function getEmbedEdit( title, icon ) {
	return class extends Component {
		constructor() {
			super( ...arguments );

			this.switchBackToURLInput = this.switchBackToURLInput.bind( this );
			this.setUrl = this.setUrl.bind( this );
			this.maybeSwitchBlock = this.maybeSwitchBlock.bind( this );
			this.setAttributesFromPreview = this.setAttributesFromPreview.bind( this );

			this.state = {
				editingURL: false,
				url: this.props.attributes.url,
			};

			this.maybeSwitchBlock();
		}

		componentWillUnmount() {
			// can't abort the fetch promise, so let it know we will unmount
			this.unmounting = true;
		}

		componentDidUpdate( prevProps ) {
			const hasPreview = undefined !== this.props.preview;
			const hadPreview = undefined !== prevProps.preview;
			// We had a preview, and the URL was edited, and the new URL already has a preview fetched.
			const switchedPreview = this.props.preview && this.props.attributes.url !== prevProps.attributes.url;
			const switchedURL = this.props.attributes.url !== prevProps.attributes.url;

			if ( switchedURL && this.maybeSwitchBlock() ) {
				return;
			}

			if ( ( hasPreview && ! hadPreview ) || switchedPreview ) {
				if ( this.props.previewIsFallback ) {
					this.setState( { editingURL: true } );
					return;
				}
				this.setAttributesFromPreview();
			}
		}

		getPhotoHtml( photo ) {
			// 100% width for the preview so it fits nicely into the document, some "thumbnails" are
			// acually the full size photo.
			const photoPreview = <p><img src={ photo.thumbnail_url } alt={ photo.title } width="100%" /></p>;
			return renderToString( photoPreview );
		}

		setUrl( event ) {
			if ( event ) {
				event.preventDefault();
			}
			const { url } = this.state;
			const { setAttributes } = this.props;
			this.setState( { editingURL: false } );
			setAttributes( { url } );
		}

		/***
		 * Maybe switches to a different embed block type, based on the URL
		 * and the HTML in the preview.
		 *
		 * @return {boolean} Whether the block was switched.
		 */
		maybeSwitchBlock() {
			const { preview } = this.props;
			const { url } = this.props.attributes;

			if ( ! url ) {
				return false;
			}

			const matchingBlock = findBlock( url );

			// WordPress blocks can work on multiple sites, and so don't have patterns,
			// so if we're in a WordPress block, assume the user has chosen it for a WordPress URL.
			if ( 'core-embed/wordpress' !== this.props.name && 'core/embed' !== matchingBlock ) {
				// At this point, we have discovered a more suitable block for this url, so transform it.
				if ( this.props.name !== matchingBlock ) {
					this.props.onReplace( createBlock( matchingBlock, { url } ) );
					return true;
				}
			}

			if ( preview ) {
				const { html } = preview;

				// This indicates it's a WordPress embed, there aren't a set of URL patterns we can use to match WordPress URLs.
				if ( includes( html, 'class="wp-embedded-content" data-secret' ) ) {
					// If this is not the WordPress embed block, transform it into one.
					if ( this.props.name !== 'core-embed/wordpress' ) {
						this.props.onReplace( createBlock( 'core-embed/wordpress', { url } ) );
						return true;
					}
				}
			}

			return false;
		}

		/***
		 * Sets block attributes based on the preview data.
		 */
		setAttributesFromPreview() {
			const { setAttributes, preview } = this.props;

			// Some plugins only return HTML with no type info, so default this to 'rich'.
			let { type = 'rich' } = preview;
			// If we got a provider name from the API, use it for the slug, otherwise we use the title,
			// because not all embed code gives us a provider name.
			const { html, provider_name: providerName } = preview;
			const providerNameSlug = kebabCase( toLower( '' !== providerName ? providerName : title ) );

			if ( includes( html, 'class="wp-embedded-content" data-secret' ) ) {
				type = 'wp-embed';
			}

			if ( html || 'photo' === type ) {
				setAttributes( { type, providerNameSlug } );
			}
		}

		switchBackToURLInput() {
			this.setState( { editingURL: true } );
		}

		render() {
			const { url, editingURL } = this.state;
			const { caption, type } = this.props.attributes;
			const { fetching, setAttributes, isSelected, className, preview, previewIsFallback } = this.props;
			const controls = (
				<BlockControls>
					<Toolbar>
						{ ( preview && ! previewIsFallback && <IconButton
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon="edit"
							onClick={ this.switchBackToURLInput }
						/> ) }
					</Toolbar>
				</BlockControls>
			);

			if ( fetching ) {
				return (
					<div className="wp-block-embed is-loading">
						<Spinner />
						<p>{ __( 'Embedding…' ) }</p>
					</div>
				);
			}

			if ( ! preview || previewIsFallback || editingURL ) {
				// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
				const label = sprintf( __( '%s URL' ), title );

				return (
					<Placeholder icon={ icon } label={ label } className="wp-block-embed">
						<form onSubmit={ this.setUrl }>
							<input
								type="url"
								value={ url || '' }
								className="components-placeholder__input"
								aria-label={ label }
								placeholder={ __( 'Enter URL to embed here…' ) }
								onChange={ ( event ) => this.setState( { url: event.target.value } ) } />
							<Button
								isLarge
								type="submit">
								{ __( 'Embed' ) }
							</Button>
							{ previewIsFallback && <p className="components-placeholder__error">{ __( 'Sorry, we could not embed that content.' ) }</p> }
						</form>
					</Placeholder>
				);
			}

			const html = 'photo' === type ? this.getPhotoHtml( preview ) : preview.html;
			const parsedUrl = parse( url );
			const cannotPreview = includes( HOSTS_NO_PREVIEWS, parsedUrl.host.replace( /^www\./, '' ) );
			// translators: %s: host providing embed content e.g: www.youtube.com
			const iframeTitle = sprintf( __( 'Embedded content from %s' ), parsedUrl.host );
			const embedWrapper = 'wp-embed' === type ? (
				<div
					className="wp-block-embed__wrapper"
					dangerouslySetInnerHTML={ { __html: html } }
				/>
			) : (
				<div className="wp-block-embed__wrapper">
					<SandBox
						html={ html }
						title={ iframeTitle }
						type={ type }
					/>
				</div>
			);

			return (
				<figure className={ classnames( className, 'wp-block-embed', { 'is-video': 'video' === type } ) }>
					{ controls }
					{ ( cannotPreview ) ? (
						<Placeholder icon={ icon } label={ __( 'Embed URL' ) }>
							<p className="components-placeholder__error"><a href={ url }>{ url }</a></p>
							<p className="components-placeholder__error">{ __( 'Previews for this are unavailable in the editor, sorry!' ) }</p>
						</Placeholder>
					) : embedWrapper }
					{ ( caption && caption.length > 0 ) || isSelected ? (
						<RichText
							tagName="figcaption"
							placeholder={ __( 'Write caption…' ) }
							value={ caption }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inlineToolbar
						/>
					) : null }
				</figure>
			);
		}
	};
}

function getEmbedBlockSettings( { title, description, icon, category = 'embed', transforms, keywords = [] } ) {
	// translators: %s: Name of service (e.g. VideoPress, YouTube)
	const blockDescription = description || sprintf( __( 'Add a block that displays content pulled from other sites, like Twitter, Instagram or YouTube.' ), title );
	return {
		title,
		description: blockDescription,
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
			type: {
				type: 'string',
			},
			providerNameSlug: {
				type: 'string',
			},
		},

		supports: {
			align: true,
		},

		transforms,

		edit: compose(
			withSelect( ( select, ownProps ) => {
				const { url } = ownProps.attributes;
				const core = select( 'core' );
				const { getEmbedPreview, isPreviewEmbedFallback, isRequestingEmbedPreview } = core;
				const preview = getEmbedPreview( url );
				const previewIsFallback = isPreviewEmbedFallback( url );
				const fetching = undefined !== url && isRequestingEmbedPreview( url );
				return {
					preview,
					previewIsFallback,
					fetching,
				};
			} )
		)( getEmbedEdit( title, icon ) ),

		save( { attributes } ) {
			const { url, caption, type, providerNameSlug } = attributes;

			if ( ! url ) {
				return null;
			}

			const embedClassName = classnames( 'wp-block-embed', {
				[ `is-type-${ type }` ]: type,
				[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
			} );

			return (
				<figure className={ embedClassName }>
					{ `\n${ url }\n` /* URL needs to be on its own line. */ }
					{ caption && caption.length > 0 && <RichText.Content tagName="figcaption" value={ caption } /> }
				</figure>
			);
		},
	};
}

export const name = 'core/embed';

export const settings = getEmbedBlockSettings( {
	title: __( 'Embed' ),
	description: __( 'The Embed block allows you to easily add videos, images, tweets, audio, and other content to your post or page.' ),
	icon: <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0z" /><path fill="none" d="M0 0h24v24H0V0z" /><g><path d="M21 3H3L1 5v3h2V5h18v14h-7v2h7l2-2V5l-2-2zM1 18v3h3c0-2-1-3-3-3zm0-4v2c3 0 5 2 5 5h2c0-4-3-7-7-7zm0-4v2c5 0 9 4 9 9h2c0-6-5-11-11-11z" /></g></svg>,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'P' && /^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ),
				transform: ( node ) => {
					return createBlock( 'core/embed', {
						url: node.textContent.trim(),
					} );
				},
			},
		],
	},
} );

const embedContentIcon = <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0z" /><path fill="none" d="M0 0h24v24H0V0z" /><g><path d="M21 3H3L1 5v3h2V5h18v14h-7v2h7l2-2V5l-2-2zM1 18v3h3c0-2-1-3-3-3zm0-4v2c3 0 5 2 5 5h2c0-4-3-7-7-7zm0-4v2c5 0 9 4 9 9h2c0-6-5-11-11-11z" /></g></svg>;
const embedAudioIcon = <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M21 3H3L1 5v14l2 2h18l2-2V5l-2-2zm0 16H3V5h18v14zM8 15a3 3 0 0 1 4-3V6h5v2h-3v7a3 3 0 0 1-6 0z" /></svg>;
const embedPhotoIcon = <svg enableBackground="new 0 0 24 24" version="1.1" viewBox="0 0 24 24" xmlSpace="preserve"><path d="M0,0h24v24H0V0z" fill="none" /><path d="M21,4H3C1.9,4,1,4.9,1,6v12c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V6C23,4.9,22.1,4,21,4z M21,18H3V6h18V18z" /><polygon points="14.5 11 11 15.51 8.5 12.5 5 17 19 17" /></svg>;
const embedVideoIcon = <svg enableBackground="new 0 0 24 24" version="1.1" viewBox="0 0 24 24" xmlSpace="preserve"><path d="M0,0h24v24H0V0z" fill="none" /><path d="m10 8v8l5-4-5-4zm9-5h-14c-1.1 0-2 0.9-2 2v14c0 1.1 0.9 2 2 2h14c1.1 0 2-0.9 2-2v-14c0-1.1-0.9-2-2-2zm0 16h-14v-14h14v14z" /></svg>;

export const common = [
	{
		name: 'core-embed/twitter',
		settings: getEmbedBlockSettings( {
			title: 'Twitter',
			icon: {
				background: '#ffffff',
				foreground: '#1da1f2',
				src: <svg height="48" width="48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M22.23 5.924c-.736.326-1.527.547-2.357.646.847-.508 1.498-1.312 1.804-2.27-.793.47-1.67.812-2.606.996C18.325 4.498 17.258 4 16.078 4c-2.266 0-4.103 1.837-4.103 4.103 0 .322.036.635.106.935-3.41-.17-6.433-1.804-8.457-4.287-.353.607-.556 1.312-.556 2.064 0 1.424.724 2.68 1.825 3.415-.673-.022-1.305-.207-1.86-.514v.052c0 1.988 1.415 3.647 3.293 4.023-.344.095-.707.145-1.08.145-.265 0-.522-.026-.773-.074.522 1.63 2.038 2.817 3.833 2.85-1.404 1.1-3.174 1.757-5.096 1.757-.332 0-.66-.02-.98-.057 1.816 1.164 3.973 1.843 6.29 1.843 7.547 0 11.675-6.252 11.675-11.675 0-.178-.004-.355-.012-.53.802-.578 1.497-1.3 2.047-2.124z"></path></g></svg>,
			},
			keywords: [ __( 'tweet' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?twitter\.com\/.+/i ],
	},
	{
		name: 'core-embed/youtube',
		settings: getEmbedBlockSettings( {
			title: 'YouTube',
			icon: {
				background: '#ffffff',
				foreground: '#ff0000',
				src: <svg height="48" width="48" viewBox="0 0 24 24"><path d="M22 8l-1-2-2-1H5L3 6 2 8v8l1 2 2 1h14l2-1 1-2v-5-3zm-12 7V9l5 3-5 3z" /></svg>,
			},
			keywords: [ __( 'music' ), __( 'video' ) ],
		} ),
		patterns: [ /^https?:\/\/((m|www)\.)?youtube\.com\/.+/i, /^https?:\/\/youtu\.be\/.+/i ],
	},
	{
		name: 'core-embed/facebook',
		settings: getEmbedBlockSettings( {
			title: 'Facebook',
			icon: {
				background: '#ffffff',
				foreground: '#3b5998',
				src: <svg height="48" width="48" viewBox="0 0 24 24"><path d="M20 3H4L3 4v16l1 1h9v-7h-3v-3h3V9c0-2 1-3 3-3h2v2h-1l-2 2v1h3v3h-3v7h5l1-1V4l-1-1z" /></svg>,
			},
		} ),
		patterns: [ /^https?:\/\/www\.facebook.com\/.+/i ],
	},
	{
		name: 'core-embed/instagram',
		settings: getEmbedBlockSettings( {
			title: 'Instagram',
			icon: <svg height="48" width="48" viewBox="0 0 24 24"><path d="M12 5a64 64 0 0 1 5 0l1 1 1 1v1a63 63 0 0 1 0 9l-1 1-1 1h-1a63 63 0 0 1-9 0l-1-1-1-1v-1a63 63 0 0 1 0-9l1-1 1-1h5m0-2a64 64 0 0 0-6 0L5 5 3 6v2a64 64 0 0 0 0 10l2 1 1 2h2a64 64 0 0 0 10 0l1-2 2-1v-2a64 64 0 0 0 0-10l-2-1-1-2h-6zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5-9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /></svg>,
			keywords: [ __( 'image' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?instagr(\.am|am\.com)\/.+/i ],
	},
	{
		name: 'core-embed/wordpress',
		settings: getEmbedBlockSettings( {
			title: 'WordPress',
			icon: embedContentIcon,
			keywords: [ __( 'post' ), __( 'blog' ) ],
		} ),
	},
	{
		name: 'core-embed/soundcloud',
		settings: getEmbedBlockSettings( {
			title: 'SoundCloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?soundcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/spotify',
		settings: getEmbedBlockSettings( {
			title: 'Spotify',
			icon: {
				background: '#ffffff',
				foreground: '#1db954',
				src: <svg width="48" height="48" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.206.857M17.81 13.7c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.13-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.072m.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.13-1.166-.624-.148-.495.13-1.017.625-1.167 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.325" /></svg>,
			},
			keywords: [ __( 'music' ), __( 'audio' ) ],
		} ),
		patterns: [ /^https?:\/\/(open|play)\.spotify\.com\/.+/i ],
	},
	{
		name: 'core-embed/flickr',
		settings: getEmbedBlockSettings( {
			title: 'Flickr',
			icon: <svg width="48" height="48" viewBox="0 0 24 24"><path d="m6.5 7c-2.75 0-5 2.25-5 5s2.25 5 5 5 5-2.25 5-5-2.25-5-5-5zm11 0c-2.75 0-5 2.25-5 5s2.25 5 5 5 5-2.25 5-5-2.25-5-5-5z" /></svg>,
			keywords: [ __( 'image' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?flickr\.com\/.+/i, /^https?:\/\/flic\.kr\/.+/i ],
	},
	{
		name: 'core-embed/vimeo',
		settings: getEmbedBlockSettings( {
			title: 'Vimeo',
			icon: {
				foreground: '#1ab7ea',
				src: <svg height="48" width="48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M22.396 7.164c-.093 2.026-1.507 4.8-4.245 8.32C15.323 19.16 12.93 21 10.97 21c-1.214 0-2.24-1.12-3.08-3.36-.56-2.052-1.118-4.105-1.68-6.158-.622-2.24-1.29-3.36-2.004-3.36-.156 0-.7.328-1.634.98l-.978-1.26c1.027-.903 2.04-1.806 3.037-2.71C6 3.95 7.03 3.328 7.716 3.265c1.62-.156 2.616.95 2.99 3.32.404 2.558.685 4.148.84 4.77.468 2.12.982 3.18 1.543 3.18.435 0 1.09-.687 1.963-2.064.872-1.376 1.34-2.422 1.402-3.142.125-1.187-.343-1.782-1.4-1.782-.5 0-1.013.115-1.542.34 1.023-3.35 2.977-4.976 5.862-4.883 2.14.063 3.148 1.45 3.024 4.16z"></path></g></svg>,
			},
			keywords: [ __( 'video' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?vimeo\.com\/.+/i ],
	},
];

export const others = [
	{
		name: 'core-embed/animoto',
		settings: getEmbedBlockSettings( {
			title: 'Animoto',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?(animoto|video214)\.com\/.+/i ],
	},
	{
		name: 'core-embed/cloudup',
		settings: getEmbedBlockSettings( {
			title: 'Cloudup',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/cloudup\.com\/.+/i ],
	},
	{
		name: 'core-embed/collegehumor',
		settings: getEmbedBlockSettings( {
			title: 'CollegeHumor',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?collegehumor\.com\/.+/i ],
	},
	{
		name: 'core-embed/dailymotion',
		settings: getEmbedBlockSettings( {
			title: 'Dailymotion',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?dailymotion\.com\/.+/i ],
	},
	{
		name: 'core-embed/funnyordie',
		settings: getEmbedBlockSettings( {
			title: 'Funny or Die',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?funnyordie\.com\/.+/i ],
	},
	{
		name: 'core-embed/hulu',
		settings: getEmbedBlockSettings( {
			title: 'Hulu',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?hulu\.com\/.+/i ],
	},
	{
		name: 'core-embed/imgur',
		settings: getEmbedBlockSettings( {
			title: 'Imgur',
			icon: embedPhotoIcon,
		} ),
		patterns: [ /^https?:\/\/(.+\.)?imgur\.com\/.+/i ],
	},
	{
		name: 'core-embed/issuu',
		settings: getEmbedBlockSettings( {
			title: 'Issuu',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?issuu\.com\/.+/i ],
	},
	{
		name: 'core-embed/kickstarter',
		settings: getEmbedBlockSettings( {
			title: 'Kickstarter',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?kickstarter\.com\/.+/i, /^https?:\/\/kck\.st\/.+/i ],
	},
	{
		name: 'core-embed/meetup-com',
		settings: getEmbedBlockSettings( {
			title: 'Meetup.com',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?meetu(\.ps|p\.com)\/.+/i ],
	},
	{
		name: 'core-embed/mixcloud',
		settings: getEmbedBlockSettings( {
			title: 'Mixcloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
		} ),
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/photobucket',
		settings: getEmbedBlockSettings( {
			title: 'Photobucket',
			icon: embedPhotoIcon,
		} ),
		patterns: [ /^http:\/\/g?i*\.photobucket\.com\/.+/i ],
	},
	{
		name: 'core-embed/polldaddy',
		settings: getEmbedBlockSettings( {
			title: 'Polldaddy',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/reddit',
		settings: getEmbedBlockSettings( {
			title: 'Reddit',
			icon: <svg width="48" height="48" viewBox="0 0 24 24"><path d="M22 11.816c0-1.256-1.02-2.277-2.277-2.277-.593 0-1.122.24-1.526.613-1.48-.965-3.455-1.594-5.647-1.69l1.17-3.702 3.18.75c.01 1.027.847 1.86 1.877 1.86 1.035 0 1.877-.84 1.877-1.877 0-1.035-.842-1.877-1.877-1.877-.77 0-1.43.466-1.72 1.13L13.55 3.92c-.204-.047-.4.067-.46.26l-1.35 4.27c-2.317.037-4.412.67-5.97 1.67-.402-.355-.917-.58-1.493-.58C3.02 9.54 2 10.56 2 11.815c0 .814.433 1.523 1.078 1.925-.037.222-.06.445-.06.673 0 3.292 4.01 5.97 8.94 5.97s8.94-2.678 8.94-5.97c0-.214-.02-.424-.052-.632.687-.39 1.154-1.12 1.154-1.964zm-3.224-7.422c.606 0 1.1.493 1.1 1.1s-.493 1.1-1.1 1.1-1.1-.494-1.1-1.1.493-1.1 1.1-1.1zm-16 7.422c0-.827.673-1.5 1.5-1.5.313 0 .598.103.838.27-.85.675-1.477 1.478-1.812 2.36-.32-.274-.525-.676-.525-1.13zm9.183 7.79c-4.502 0-8.165-2.33-8.165-5.193S7.457 9.22 11.96 9.22s8.163 2.33 8.163 5.193-3.663 5.193-8.164 5.193zM20.635 13c-.326-.89-.948-1.7-1.797-2.383.247-.186.55-.3.882-.3.827 0 1.5.672 1.5 1.5 0 .482-.23.91-.586 1.184zm-11.64 1.704c-.76 0-1.397-.616-1.397-1.376 0-.76.636-1.397 1.396-1.397.76 0 1.376.638 1.376 1.398 0 .76-.616 1.376-1.376 1.376zm7.405-1.376c0 .76-.615 1.376-1.375 1.376s-1.4-.616-1.4-1.376c0-.76.64-1.397 1.4-1.397.76 0 1.376.638 1.376 1.398zm-1.17 3.38c.15.152.15.398 0 .55-.675.674-1.728 1.002-3.22 1.002l-.01-.002-.012.002c-1.492 0-2.544-.328-3.218-1.002-.152-.152-.152-.398 0-.55.152-.152.4-.15.55 0 .52.52 1.394.775 2.67.775l.01.002.01-.002c1.276 0 2.15-.253 2.67-.775.15-.152.398-.152.55 0z" /></svg>,
		} ),
		patterns: [ /^https?:\/\/(www\.)?reddit\.com\/.+/i ],
	},
	{
		name: 'core-embed/reverbnation',
		settings: getEmbedBlockSettings( {
			title: 'ReverbNation',
			icon: embedAudioIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?reverbnation\.com\/.+/i ],
	},
	{
		name: 'core-embed/screencast',
		settings: getEmbedBlockSettings( {
			title: 'Screencast',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?screencast\.com\/.+/i ],
	},
	{
		name: 'core-embed/scribd',
		settings: getEmbedBlockSettings( {
			title: 'Scribd',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?scribd\.com\/.+/i ],
	},
	{
		name: 'core-embed/slideshare',
		settings: getEmbedBlockSettings( {
			title: 'Slideshare',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(.+?\.)?slideshare\.net\/.+/i ],
	},
	{
		name: 'core-embed/smugmug',
		settings: getEmbedBlockSettings( {
			title: 'SmugMug',
			icon: embedPhotoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?smugmug\.com\/.+/i ],
	},
	{
		name: 'core-embed/speaker',
		settings: getEmbedBlockSettings( {
			title: 'Speaker',
			icon: embedAudioIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?speakerdeck\.com\/.+/i ],
	},
	{
		name: 'core-embed/ted',
		settings: getEmbedBlockSettings( {
			title: 'TED',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.|embed\.)?ted\.com\/.+/i ],
	},
	{
		name: 'core-embed/tumblr',
		settings: getEmbedBlockSettings( {
			title: 'Tumblr',
			icon: embedContentIcon,
		} ),
		patterns: [ /^https?:\/\/(www\.)?tumblr\.com\/.+/i ],
	},
	{
		name: 'core-embed/videopress',
		settings: getEmbedBlockSettings( {
			title: 'VideoPress',
			icon: embedVideoIcon,
			keywords: [ __( 'video' ) ],
		} ),
		patterns: [ /^https?:\/\/videopress\.com\/.+/i ],
	},
	{
		name: 'core-embed/wordpress-tv',
		settings: getEmbedBlockSettings( {
			title: 'WordPress.tv',
			icon: embedVideoIcon,
		} ),
		patterns: [ /^https?:\/\/wordpress\.tv\/.+/i ],
	},
];
